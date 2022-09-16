// IMPORTS
const user = require("../models/UserModel");
const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = require("../utilities/status_codes");

// DEPENDENCIES
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



async function signin(req, res) {

	const { email, password } = req.body;

	if (!email) {
		var response = {
			error: {message: "Email address not provided"},
			data: null
		}
		res.statusCode = BAD_REQUEST;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
		
		return;
	}
	
	if (!password) {
		var response = {
			error: {message: "Password not provided"},
			data: null
		}
		res.statusCode = BAD_REQUEST;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
	
		return;
	}

	const User = new user({email: email});

	User.on("validated", async () => {
		var authentic = await bcrypt.compare(password, User.password);
		// You may consider two-step authentication and additional authentication for suspicious signin attempts in the future.

		if (authentic) {
			// Save session data in database
			function rand() {return Math.trunc(Math.random()*10).toString()}
			User.sessionLogs = JSON.parse(User.sessionLogs);
			var sessionIndex = Object.keys(User.sessionLogs).length.toString().padStart(3, "0");
			var sessionId = sessionIndex + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand(); // `sessionId` is the key for each session of a user in the database - 3-9
			var currentTime = new Date();
			var newSession = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand(); // `currentSession` refers to the active session for this access (device) - 10
			
			User.sessionLogs[sessionId] = {
				initiated: currentTime,
				closed: null, // A DATETIME object (when closed) - Recent sessions (for reference purposes) are not deleted (for a while) on the server after users log out.
				currentSession: newSession,
				device: {agent: req.header("user-agent"), ip: req.ip},
				sessions: [[currentTime, currentTime]] // `sessions` holds a list of each browsing session as lists of 'start' and 'end' times. 'end' may refer to 'last used time', if that browsing session is not closed yet.
			};
			User.lastLoggedIn = currentTime;
			User.lastSeen = currentTime;

			User.save((err) => {
				if (!err) {
					// Send session (access token) in response cookie
					try {
						var reset = Number(currentTime.getFullYear().toString() + currentTime.getMonth().toString().padStart(2, "0") + currentTime.getDate().toString().padStart(2, "0"));
						var access = { id: User.id, sessionId: sessionId, time: currentTime, reset: reset };
						var token = jwt.sign(access, process.env.SESSIONS_KEY);
						
						res.cookie("access", token, {
							secure: process.env.NODE_ENV !== "development",
							httpOnly: true,
							signed: true,
							maxAge: 90 * 24 * 60 * 60 * 1000 // access expires in 90 days
						});

						res.cookie("session", newSession, {
							secure: process.env.NODE_ENV !== "development",
							httpOnly: true,
							signed: true
						}); // session expires after closing the browser

						// Send signin success
						var response = {
							error: null,
							data: "Account signed in successfully"
						}
						res.statusCode = OK;
						res.setHeader("Content-Type", "application/json");
						res.send(response);
					}
					
					catch (e) { // Error must be due to server.
						 var response = {
							error: {message: "Internal Server Error"},
							data: null
						}
						res.statusCode = INTERNAL_SERVER_ERROR;
						res.setHeader("Content-Type", "application/json");
						res.send(response);
						console.log(e);
					}

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
			
		} else {
			var response = {
				error: {message: "Incorrect Password"},
				data: null
			}
			res.statusCode = UNAUTHORIZED;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}
	});

	User.on("rejected", (_) => {
		var response = {
			error: {message: "Unknown email address"},
			data: null
		}
		res.statusCode = UNAUTHORIZED;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
	});
}

module.exports = signin;