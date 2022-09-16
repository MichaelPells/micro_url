// Creates a new browsing session
// And asynchronously,
// Records a new last used for access, and a new user's last seen time - PER MINUTE
// Closes all expired access sessions - ONCE A DAY

// IMPORTS
const user = require("../models/UserModel");

// DEPENDENCIES



function sessions(req, res, next) {

	if (req.sessionId) { // Client is signed-in
		var User = new user({email: req.user.email});

		User.on("validated", () => {
			var sessions = JSON.parse(User.sessionLogs); // Updating...
			var currentTime = new Date();
			var today = Number(currentTime.getFullYear().toString() + currentTime.getMonth().toString().padStart(2, "0") + currentTime.getDate().toString().padStart(2, "0"));

			// TASK 1: Create a new browsing session if client has restarted
			if (req.signedCookies.session !== sessions[req.sessionId].currentSession) { // Shows the client is starting another browsing session, since cookie `session` expires after a session
				// First create a new session, register it appropriately in the database, and update cookie `session`

				function rand() {return Math.trunc(Math.random()*10).toString()}
				var newSession = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand();

				sessions[req.sessionId].currentSession = newSession;
				sessions[req.sessionId].sessions.push([currentTime, currentTime]);
				User.lastLoggedIn = currentTime;
				User.lastSeen = currentTime;

				User.sessionLogs = sessions // Return changes to `User.sessionLogs`

				res.cookie("session", newSession, {
					secure: process.env.NODE_ENV !== "development",
					httpOnly: true,
					signed: true
				}); // session expires after closing the browser
			}

			// POST-TASK 1: Asynchronously proceed with request
			async function proceed () {
				next();
			}
			proceed();

			// TASK 2: Update current access session's last used time in database, per minute
			var lastSeen = new Date(User.lastSeen); // Updating...
			if (lastSeen.getTime() <= currentTime.getTime() - 60000) { // It's been up to a minute since the last recorded request was made, record access last used time and user's last seen time
				var last = sessions[req.sessionId].sessions.length - 1;
				sessions[req.sessionId].sessions[last][1] = currentTime;
				User.lastSeen = currentTime;

				User.sessionLogs = sessions // Return changes to `User.sessionLogs`
			}

			// TASK 3: Close all expired access sessions, once per day.
			if (req.sessionReset) { // It's a new day, check if there are any expired access to close!
				function calcAccessExpiry (lastUsedDate) {
					var expires = String(lastUsedDate + 300);
					var month = Number(expires.slice(4, 6));
					var year = String(Number(expires.slice(0, 4)) + Math.floor(month / 12));
					var month = String(month % 12).padStart(2, "0");
					var day = expires.slice(6, 8);
					return Number(year + month + day);
				}

				var otherSessions = Object.keys(sessions);
				otherSessions.splice(otherSessions.indexOf(req.sessionId), 1);

				for (var session of otherSessions) {
					var last = sessions[session].sessions.length - 1;
					var lastUsed = new Date(sessions[session].sessions[last][1]);
					var lastUsedDate = Number(lastUsed.getFullYear().toString() + lastUsed.getMonth().toString().padStart(2, "0") + lastUsed.getDate().toString().padStart(2, "0"));
					var accessExpires = calcAccessExpiry(lastUsedDate);

					if (!sessions[session].closed && accessExpires <= today) { // accessExpires stands for expiry date (3 months) - If less than `today`, implies expired access (client failed to sign in for 3 months)
						sessions[session].closed = lastUsed; // Mark session as closed
						delete sessions[session].currentSession; // Remove current session (a mere handle bound with cookie `session` for tracking client's browsing session changes)

						User.sessionLogs = sessions // Return changes to `User.sessionLogs`
					}
				}
			}

			// POST-TASKS: Save, if needed
			User.save().catch(_ => {});
		});
	}

	else { // Client is signed-in
		next();
	}
}

module.exports = sessions;