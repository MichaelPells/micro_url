// SETTINGS
require("dotenv").config();
const host = "localhost";
const port = process.env.PORT || 5000;


// BOOT PROCESS
async function main() {

	console.log("> Server booting");
	
	// DEPENDENCIES
	const express = require("express");
	const cors = require("cors");

	console.log("> Server looking for required environment variables");
	require("./init_env");

	console.log("> Server setting up database");
	await require("./database/scripts/create_db");

	console.log("> Server connecting to database");
	await require("./database/scripts/connect_db");

	console.log("> Server setting up tables");
	await require("./database/scripts/setup_tables");

	const app = express();

	app.listen(port, host, () => {
		console.log(`> Server started`);
		console.log(`
    | Time:        ${new Date().toLocaleString()}
    | Environment: ${process.env.NODE_ENV}
    | Address:     http://${host}:${port}
`);
	});

	// Catch uncaught errors
	process.on("uncaughtException", (err) => {
		console.log(err);
		process.exit(1);
	});


	// IMPORTS
	const NEW = require("./views/new");
	const VIEW = require("./views/view");
	const CHANGE = require("./views/change");
	const REMOVE = require("./views/remove");
	const REDIRECT = require("./views/redirect");

	// BACK-END BUSINESS
	app.use(cors());
	app.use(express.json({extended: false, limit: '1024mb'}));

	app.get("/new", NEW);
	app.get("/view", VIEW);
	app.get("/change", CHANGE);
	app.get("/remove", REMOVE);
	app.get("/:short", REDIRECT);
}

main();