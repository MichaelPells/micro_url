// IMPORTS
var Link = require("../models/link_model");
var { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST, FORBIDDEN } = require("../utilities/status_codes");

interface Response {
	error: object | null,
	data: any
}

async function change(req: any, res: any) {
	const short = req.query.short;
	const data: object = {
		owner: req.query.owner,
		short: req.query.new_short,
		url: req.query.url
	}
	const link = new Link({short: short});
	link.on(["validated", "rejected"], async () => {
		if (link.info.existing) { // If link exists
			try {
				link.update(data);

				try {
					await link.save();
					var response: Response = {
						error: null,
						data: "Short URL updated successfully"
					}
					res.statusCode = OK;
					res.setHeader("Content-Type", "application/json");
					res.send(response);

				} catch (err) { // Error must be due to server.
					var response: Response = {
						error: {message: "Internal Server Error"},
						data: null
					}
					res.statusCode = INTERNAL_SERVER_ERROR;
					res.setHeader("Content-Type", "application/json");
					res.send(response);
					console.log(err);
				}

			} catch (err: any) { // link data validation failed
				var response: Response = {
					error: err,
					data: null
				}
				res.statusCode = BAD_REQUEST;
				res.setHeader("Content-Type", "application/json");
				res.send(response);
			}

		} else { // If link does not exist
			var response: Response = {
				error: {message: "Link does not exist"},
				data: null
			}
			res.statusCode = FORBIDDEN;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}
	});
}

module.exports = change;