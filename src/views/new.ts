// IMPORTS
var Link = require("../models/link_model")
var { CREATED, INTERNAL_SERVER_ERROR, FORBIDDEN, BAD_REQUEST } = require("../utilities/status_codes");

interface Response {
	error: object | null,
	data: any
}

function create(req: any, res: any) {
	const data: object = {
		owner: req.query.owner,
		short: req.query.short,
		url: req.query.url
	}

	const link = new Link(data);
	link.on("validated", async () => {
		if (!link.info.existing) { // If link does not already exist
			try {
				await link.save();
				var response: Response = {
					error: null,
					data: "Short URL created successfully"
				}
				res.statusCode = CREATED;
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
		} else { // If link exists
			var response: Response = {
				error: {message: "Short URL already taken"},
				data: null
			}
			res.statusCode = FORBIDDEN;
			res.setHeader("Content-Type", "application/json");
			res.send(response);
		}
	});

	link.on("rejected", (err: Error) => { // link data validation failed
		var response = {
			error: err,
			data: null
		}
		res.statusCode = BAD_REQUEST;
		res.setHeader("Content-Type", "application/json");
		res.send(response);
	});

}

module.exports = create;