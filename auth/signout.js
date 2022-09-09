// IMPORTS
const user = require("../models/UserModel");
const { OK, INTERNAL_SERVER_ERROR } = require("../utilities/status_codes");

// DEPENDENCIES



async function signout(req, res) {

	const User = new user({email: req.user.email});

	User.on(["validated", "rejected"], async () => {
		User.sessionLogs = JSON.parse(User.sessionLogs);
		User.sessionLogs[req.sessionId].closed = new Date(); // Mark session as closed
		delete User.sessionLogs[req.sessionId].currentSession; // Remove current session (a mere handle bound with cookie `session` for tracking client's browsing session changes)
		
		User.save((err) => {
			if (!err) {
				// Clear session (access token and session token) in response cookie
				res.clearCookie("access");
				res.clearCookie("session");

				// Send signout success
				var response = {
					error: null,
					data: "Account signed out successfully"
				}
				res.statusCode = OK;
				res.setHeader("Content-Type", "application/json");
				res.send(response);

			} else { // Error must be due to server.
				var response = {
					error: {message: "Internal Server Error"},
					data: null
				}
				res.statusCode = INTERNAL_SERVER_ERROR;
				res.setHeader("Content-Type", "application/json");
				res.send(response);
				console.log(err);
			}
		});
	});
}

module.exports = signout;