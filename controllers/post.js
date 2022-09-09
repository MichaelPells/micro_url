// IMPORTS
const handler = {
	"/signup": require("../auth/signup"),
	"/signin": require("../auth/signin"),
	"/signout": require("../auth/signout")
}
const { METHOD_NOT_ALLOWED, FORBIDDEN, UNAUTHORIZED } = require("../utilities/status_codes");

// DEPENDENCIES



const routes = Object.keys(handler);

function main(req, res) {
	var route = req.path;

	if (!routes.includes(route)) {
		res.statusCode = METHOD_NOT_ALLOWED;
		res.end();

		return;
	}

	else {	
		if (req.authorized) { // If request has been authorized (for several allowed cases) - See auth/authorize.js
		
			handler[route](req, res);

		}

		else if (req.unauthorizedOnly) {
			res.statusCode = FORBIDDEN;
			res.end();
		}

		else if (!req.unauthorizedOnly) {
			res.statusCode = UNAUTHORIZED;
			res.end();
		}
		
	}
}

module.exports = main;