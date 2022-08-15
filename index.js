const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


// SETTINGS
const host = "localhost";
const port = 2222;

const app = express();

app.use(cors());
//app.use(express.json({limit: '1024mb'}));
//app.use(express.static(PATH.join(__dirname, "public/")));


function send(res, file, contentType) {
	fs.readFile(`public${file}`, (err, data) => {
        if (!err) {
			res.statusCode = "200";

			if (contentType == undefined) {
				contentType =
					file.endsWith('.html')? "text/html" :
					file.endsWith('.js')? "text/javascript" :
					file.endsWith('.css')? "text/css" :
					file.endsWith('.json')? "application/json" :
					file.endsWith('.txt')? "text/plain" :
					file.endsWith('.xml')? "application/xml" :
					file.endsWith('.php')? "application/x-httpd-php" :
					file.endsWith('.ico')? "image/vnd.microsoft.icon" :
					file.endsWith('.jpg')||file.endsWith('.jpeg')? "image/jpeg" :
					file.endsWith('.png')? "image/png" :
					file.endsWith('.svg')? "image/svg+xml" :
					file.endsWith('.gif')? "image/gif" :
					file.endsWith('.webp')? "image/webp" :
					file.endsWith('.tif')? "image/tiff" :
					file.endsWith('.mp4')? "video/mp4" :
					file.endsWith('.webm')? "video/webm" :
					file.endsWith('.pdf')? "application/pdf" :
					file.endsWith('.tif')? "image/tiff" :
					file.endsWith('.ttf')? "font/ttf" :
					file.endsWith('.woff')? "font/woff" :
					file.endsWith('.woff2')? "font/woff2" :
					null;
			}
            
			if (contentType) {res.setHeader("Content-Type", contentType)}
			
            res.send(data);
            
        } else {
			res.statusCode = "404";
			res.end();
        }
    });
}

app.get(/^\/.*/, (req, res) => {
	var absoluteURL = `http://${host}:${port}${req.url}`;
	var urlObject = new URL(absoluteURL)
	var urlPath = urlObject.pathname
	var param = urlPath.split('/');

	// Request-Response Rules (RRR)
	if (false) {}

	else if (urlPath == "/favicon.ico") {send(res, urlPath)}
	else if (param[1] == "static") {send(res, urlPath)}
	else if (urlPath == "/") {send(res, "/index.html")}

	else {send(res)}
});

app.listen(port, host, () => {
	console.log(`Server communicating at http://${host}:${port}`);
});