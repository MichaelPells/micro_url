// IMPORTS
const user = require("../models/UserModel");

// DEPENDENCIES
const jwt = require("jsonwebtoken");



// Note:
// `req.authorized` is only a marker for whether a client's request can be granted or not.
// It does not refer to whether a client is sign-in or not.
// Such data are provided by the `req.sessionId` and `req.user` objects

async function authorize(req, res, next) {

	if (req.protected) { // Route is protected
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
				if (access.reset !== `${currentTime.getMonth()}-${currentTime.getDate()}`) { // It's a new day, reset the cookie's expiry date!
					res.cookie("access", token, {
						secure: process.env.NODE_ENV !== "development",
						httpOnly: true,
						signed: true,
						maxAge: 90 * 24 * 60 * 60 * 1000
					});
				}

				var sessionToken = req.signedCookies.session;

				if (sessionToken !== sessions[access.sessionId].currentSession) { // Shows the client is starting another browsing session, since cookie `session` expires after a session
					// First create a new session, register it appropriately in the database, and update cookie `session`
					var UserX = new user({email: User.email});
					
					UserX.on("validated", async () => {
						function rand() {return Math.trunc(Math.random()*10).toString()}
						var newSession = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand();
						UserX.sessionLogs = JSON.parse(UserX.sessionLogs);
						
						UserX.sessionLogs[access.sessionId].currentSession = newSession;
						UserX.sessionLogs[access.sessionId].sessions.push([currentTime]);
						UserX.lastLoggedIn = currentTime;
						await UserX.save();

						res.cookie("session", newSession, {
							secure: process.env.NODE_ENV !== "development",
							httpOnly: true,
							signed: true
						}); // session expires after closing the browser

						req.user = User;
						req.sessionId = access.sessionId;

						if (!req.unauthorizedOnly) { // Route is for only signed-in users
							req.authorized = true; // Authorize request
						}
						else { // Route is for only guests
							req.authorized = false; // Reject request
						}
		
						next();
					});
				}
				else {
					req.user = User;
					req.sessionId = access.sessionId;

					if (!req.unauthorizedOnly) { // Route is for only signed-in users
						req.authorized = true; // Authorize request
					}
					else { // Route is for only guests
						req.authorized = false; // Reject request
					}
	
					next();
				}
			} else {
				throw "error";
			}
		} catch (e) { // Client is not signed-in

			if (req.signedCookies.access !== undefined) { // Cookie must have been tampered
				// Clear session (access token and session token) in response cookie
				res.clearCookie("access");
				res.clearCookie("session");
				// We may not be able to access `sessionId` from this invalid cookie, hence we cannot update the right session in database
			}

			if (req.unauthorizedOnly) { // Route is for only guests
				req.authorized = true; // Authorize request
			}
			else { // Route is for only signed-in
				req.authorized = false; // Reject request
			}
			
			next();
		}
	}

	else { // Route is not protected
		req.authorized = true; // Authorize request
			
		next();
	}
}

module.exports = authorize;