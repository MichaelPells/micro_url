// IMPORTS
const Link = require("../models/link_model")
const { REDIRECT, INTERNAL_SERVER_ERROR, NOT_FOUND } = require("../utilities/status_codes");

async function main(req, res) {
	try {
		const link = await Link.findOne(req.params.short);

		if (link) {
			res.statusCode = REDIRECT;
			res.redirect(link.url);
		} else {
			var response = {
				error: {message: "Page not found"},
				data: null
			}
			res.statusCode = NOT_FOUND;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}

	} catch (err) {
		var response = {
			error: {message: "Internal Server Error"},
			data: null
		}
		res.statusCode = INTERNAL_SERVER_ERROR;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
		console.log(err);
	}
}

module.exports = main;