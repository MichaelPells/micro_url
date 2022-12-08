// IMPORTS
var Link = require("../models/link_model")
var { REDIRECT, INTERNAL_SERVER_ERROR, NOT_FOUND } = require("../utilities/status_codes");

interface Response {
	error: object | null,
	data: any
}

async function redirect(req: any, res: any) {
	try {
		const link = await Link.findOne(req.params.short);

		if (link) {
			res.statusCode = REDIRECT;
			res.redirect(link.url);
		} else {
			var response: Response = {
				error: {message: "Page not found"},
				data: null
			}
			res.statusCode = NOT_FOUND;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}

	} catch (err) {
		var response: Response = {
			error: {message: "Internal Server Error"},
			data: null
		}
		res.statusCode = INTERNAL_SERVER_ERROR;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
		console.log(err);
	}
}

module.exports = redirect;