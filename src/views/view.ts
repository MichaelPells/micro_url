// IMPORTS
var Link = require("../models/link_model")
var { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST } = require("../utilities/status_codes");

interface Response {
	error: object | null,
	data: any
}

async function view(req: any, res: any) {
	const short =  req.query.short;
	const owner = req.query.owner;

	try {
		if (short) {
			var data = await Link.findOne(short);
		} else if (owner) {
			var data = await Link.findMany(owner);
		} else {
			var response: Response = {
				error: {message: "No search parameter given"},
				data: null
			}
			res.statusCode = BAD_REQUEST;
			res.setHeader("Content-Type", "application/json");
			res.send(response);

			return;
		}

		var response: Response = {
			error: null,
			data: data
		}
		res.statusCode = OK;
		res.setHeader("Content-Type", "application/json");
		res.send(response);

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

module.exports = view;