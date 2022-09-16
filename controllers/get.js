// IMPORTS
const { OK, NOT_FOUND, FORBIDDEN, UNAUTHORIZED } = require("../utilities/status_codes");

// DEPENDENCIES
const fs = require("fs");
const path = require("path");
const mimeType = require("mime-types");



function main(req, res) {
	var reqDB = {
		urlPath: req.path
	}

	var view = req.view;

	if (req.authorized) { // If request has been authorized (for several allowed cases) - See auth/authorize.js

		var file = view[0];
		var contentType = view[1] && view[1].contentType;
		if (file && file.startsWith(":")) {
			file = reqDB[file.slice(1, file.length)];
		}

		fs.readFile(`public${file}`, (err, data) => {
			if (!err) {
				res.statusCode = OK;
	
				if (contentType == undefined) {
					contentType = mimeType.lookup(file) || "application/octet-stream";
				}
				
				res.setHeader("Content-Type", contentType);
				res.send(data);
			} 
			
			else {
				res.statusCode = NOT_FOUND;
				res.end();
			}
		});
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

module.exports = main;