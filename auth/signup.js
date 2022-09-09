// IMPORTS
const user = require("../models/UserModel");
const { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, OK } = require("../utilities/status_codes");

// DEPENDENCIES
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



async function signup(req, res) {

	// Validate Password - since hashed passwords cannot be validated by the user model
	var password = req.body.password;
	var error = {message: ""};

	if (!password) {
		error.message = "Password not provided"
	} else if (password.length < 8) {
		error.message = "Password is too short"
	} else if (password.length > 255) {
		error.message = "Password is too long"
	}
	// Do other password validations here

	if (error.message) {
		var response = {
			error: error,
			data: null
		}
		res.statusCode = BAD_REQUEST;
		res.setHeader("Content-Type", "application/json");
		res.send(response);

		return;
	}
	
	const salt = await bcrypt.genSalt(10);

	// Extract data from `req.body`
	const data = {
		email: req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		gender: req.body.gender,
		DOB: req.body.DOB,
		nationality: req.body.nationality,
		country: req.body.country,
		password: await bcrypt.hash(req.body.password, salt) // Hashed password
	};

	// Create a new user model and save
	const User = new user(data);

	User.on("validated", () => {
		if (!User.info.existing) {
			User.save((err) => {
				if (!err) { // If successful
					// Save session data in database
					function rand() {return Math.trunc(Math.random()*10).toString()}
					var sessionId = "000" + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand(); // `sessionId` is the key for each session of a user in the database - 3-9
					var currentTime = new Date();
					var newSession = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand(); // `currentSession` refers to the active session for this access (device) - 10

					User.sessionLogs = {};
					User.sessionLogs[sessionId] = {
						initiated: currentTime,
						currentSession: newSession,
						closed: null, // A DATETIME object (when closed) - Recent sessions (for reference purposes) are not deleted on the server after users log out.
						device: {agent: req.header("user-agent"), ip: req.ip},
						sessions: [[currentTime]] // `sessions` holds a list of each browsing session as lists of 'start' and 'end'. May be: When a new session is opened, the previous session gets updated with end date at index 1. Or: Each request updated the end date?
					};
					User.lastLoggedIn = currentTime;

					User.save((err) => {
						if (!err) {
							// Send session (access token) in response cookie
							try {
								var token = jwt.sign({ id: User.id, sessionId: sessionId, time: currentTime, reset: `${currentTime.getMonth()}-${currentTime.getDate()}` }, process.env.SESSIONS_KEY);
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

								// Send signup success
								var response = {
									error: null,
									data: "Account created successfully"
								}
								res.statusCode = CREATED;
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

				} else { // Error must be due to server, or an unexplanable deviation in User data.
					var response = {
						error: err,
						data: null
					}
					res.statusCode = INTERNAL_SERVER_ERROR;
					res.setHeader("Content-Type", "application/json");
					res.send(response);
					console.log(err);
				}
			});

		} else { // Email address is already in database
			var response = {
				error: {message: "Email Address is already registered"},
				data: null
			}
			res.statusCode = OK;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}
	});

	User.on("rejected", (err) => { // User data validation failed
		var response = {
			error: err,
			data: null
		}
		res.statusCode = BAD_REQUEST;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
	});
}

module.exports = signup;