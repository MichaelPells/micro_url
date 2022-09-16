// IMPORTS
const user = require("../models/UserModel");

// DEPENDENCIES
const jwt = require("jsonwebtoken");



// Note:
// `req.authorized` is only a marker for whether a client's request can be granted or not.
// It does not refer to whether a client is sign-in or not.
// Such data are provided by the `req.sessionId` and `req.user` objects



async function authorize(req, res, next) {

	try {
		var token = req.signedCookies.access;
		var access = jwt.verify(token, process.env.SESSIONS_KEY);
		var User = await user.findOne({id: access.id});
		var sessions = JSON.parse(User.sessionLogs);

		if (
			User.sessionLogs &&
			sessions[access.sessionId] &&
			!sessions[access.sessionId].closed &&
			sessions[access.sessionId].device.agent === req.header("user-agent") &&
			sessions[access.sessionId].device.ip === req.ip &&
			sessions[access.sessionId].initiated === access.time
		) { // Client is signed-in

			var currentTime = new Date();

			// The aim is to maintain access on a device (over one-sign-in-multiple-sessions), if a user visits at least once in 90 days after signing in.
			// To achieve this, the expiry date of cookie `access` is extended to 90-days once a day (only when the user comes online)
			
			var reset = Number(currentTime.getFullYear().toString() + currentTime.getMonth().toString().padStart(2, "0") + currentTime.getDate().toString().padStart(2, "0"));

			function calcAccessExpiry () {
				var expires = String(access.reset + 300);
				var month = Number(expires.slice(4, 6));
				var year = String(Number(expires.slice(0, 4)) + Math.floor(month / 12));
				var month = String(month % 12).padStart(2, "0");
				var day = expires.slice(6, 8);
				return Number(year + month + day);
			}
			var accessExpires = calcAccessExpiry();

			if (access.reset < reset && accessExpires > reset) { // It's a new day, reset the cookie's expiry date, if access is not expired!
				access.reset = reset;
				token = jwt.sign(access, process.env.SESSIONS_KEY);
				res.cookie("access", token, {
					secure: process.env.NODE_ENV !== "development",
					httpOnly: true,
					signed: true,
					maxAge: 90 * 24 * 60 * 60 * 1000
				});
				req.sessionReset = true; // Announce a session reset, for use in sessions.js
			}

			else if (accessExpires <= reset) { // accessExpires stands for expiry date (3 months) - If less than `reset`, implies expired cookie (failed to reset for 3 months)
				// Sign out access on this device, remove cookies and deny authorization
				await signout();
				throw "error";
			}

			else if (access.reset > reset) { // Cookie's last reset is confusingly ahead of today - Cookie must have been tampered
				// Sign out access on this device, remove cookies and deny authorization
				await signout();
				throw "error";
			}

			// signout function replicating necessary features from the /signout handler
			function signout () {
				return new Promise ((resolve, reject) => {

					try {
						var UserX = new user({email: User.email});
									
						UserX.on("validated", async () => {
							UserX.sessionLogs = JSON.parse(User.sessionLogs);
							UserX.sessionLogs[access.sessionId].closed = currentTime; // Mark session as closed
							delete UserX.sessionLogs[access.sessionId].currentSession; // Remove current session (a mere handle bound with cookie `session` for tracking client's browsing session changes)
							
							UserX.save((err) => {
								if (!err) {
									resolve();
								} else { // Error must be due to server, though.
									reject();
								}
							});
						});
					} catch (e) {}
				});
			}
			// Authorization flow continues here

			req.user = User;
			req.sessionId = access.sessionId;

			if (req.protected) { // Route is protected
				if (!req.unauthorizedOnly) { // Route is for only signed-in users
					req.authorized = true; // Authorize request
				}
				else { // Route is for only guests
					req.authorized = false; // Reject request
				}
			} else { // Route is not protected
				req.authorized = true; // Authorize request
			}

			next();
		} else {
			throw "error";
		}
	} catch (e) { // Client is not signed-in

		// Clear session (access token and session token) in response cookie if any
		if (req.signedCookies.access !== undefined) { // Cookie must have been tampered (if === false or expired cookie, for instance)
			res.clearCookie("access");
			// We may not be able to access `sessionId` from this invalid cookie, hence we cannot update the right session in database
		}
		if (req.signedCookies.session !== undefined) { // Clear session if it is uncleared yet
			res.clearCookie("session");
		}

		if (req.protected) { // Route is protected
			if (req.unauthorizedOnly) { // Route is for only guests
				req.authorized = true; // Authorize request
			}
			else { // Route is for only signed-in
				req.authorized = false; // Reject request
			}
		} else { // Route is not protected
			req.authorized = true; // Authorize request
		}
		
		next();
	}
}

module.exports = authorize;