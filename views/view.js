// IMPORTS
const Link = require("../models/link_model")
const { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST } = require("../utilities/status_codes");

async function main(req, res) {
	const short =  req.query.short;
	const owner = req.query.owner;

	try {
		if (short) {
			var data = await Link.findOne(short);
		} else if (owner) {
			var data = await Link.findMany(owner);
		} else {
			var response = {
				error: {message: "No search parameter given"},
				data: null
			}
			res.statusCode = BAD_REQUEST;
			res.setHeader("Content-Type", "application/json");
			res.send(response);

			return;
		}

		var response = {
			error: null,
			data: data
		}
		res.statusCode = OK;
		res.setHeader("Content-Type", "application/json");
		res.send(response);

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