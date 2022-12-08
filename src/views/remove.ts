// IMPORTS
var Link = require("../models/link_model")
var { OK, INTERNAL_SERVER_ERROR, FORBIDDEN } = require("../utilities/status_codes");

interface Response {
	error: object | null,
	data: any
}

async function remove(req: any, res: any) {
	const short = req.query.short;

	const link = new Link({short: short});
	link.on(["validated", "rejected"], async () => {
		if (link.info.existing) { // If link exists
			try {
				await link.delete();
	
				var response: Response = {
					error: null,
					data: "URL deleted successfully"
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

module.exports = remove;