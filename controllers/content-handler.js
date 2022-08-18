// IMPORTS
const views = require("../views") // Request-Response Rules

// DEPENDENCIES
const fs = require("fs");
const path = require("path");
const mimeType = require("mime-types")



const patterns = Object.keys(views);
const rpatterns = patterns.map(view => {
	return RegExp(`^${view}$`)
});


function main(req, res) {
	var reqDB = {
		urlPath: req.path
	}
	
	var n = rpatterns.findIndex(view => view.test(req.path));
	var view = views[patterns[n]];
	var file = view[0];
	var contentType = view[1];

	if (file && file.startsWith(":")) {
		file = reqDB[file.slice(1, file.length)]
	}

	fs.readFile(`public${file}`, (err, data) => {
		if (!err) {
			res.statusCode = "200";

			if (contentType == undefined) {
				contentType = mimeType.lookup(file) || "application/octet-stream";
			}
			
			res.setHeader("Content-Type", contentType);
			res.send(data);
			
		} else {
			res.statusCode = "404";
			res.end();
		}
	});
}

module.exports = main;