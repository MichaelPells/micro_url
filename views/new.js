// IMPORTS
const Link = require("../models/link_model")
const { CREATED, INTERNAL_SERVER_ERROR, FORBIDDEN, BAD_REQUEST } = require("../utilities/status_codes");

function main(req, res) {
	const data = {
		owner: req.query.owner,
		short: req.query.short,
		url: req.query.url
	}

	const link = new Link(data);
	link.on("validated", async () => {
		if (!link.info.existing) { // If link does not already exist
			try {
				await link.save();
				var response = {
					error: null,
					data: "Short URL created successfully"
				}
				res.statusCode = CREATED;
				res.setHeader("Content-Type", "application/json");
				res.send(response);

			} catch (err) { // Error must be due to server.
				var response = {
					error: {message: "Internal Server Error"},
					data: null
				}
				res.statusCode = INTERNAL_SERVER_ERROR;
				res.setHeader("Content-Type", "application/json");
				res.send(response);
				console.log(err);
			}
		} else { // If link exists
			var response = {
				error: {message: "Short URL already taken"},
				data: null
			}
			res.statusCode = FORBIDDEN;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}
	});

	link.on("rejected", (err) => { // link data validation failed
		var response = {
			error: err,
			data: null
		}
		res.statusCode = BAD_REQUEST;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
	});

}

module.exports = main;