// SETTINGS
require("dotenv").config();
const host = "localhost";
const port = process.env.PORT || 2222;


// BOOT PROCESS
async function boot() {
	console.log("> Server booting");
	
	// DEPENDENCIES
	const express = require("express");
	const cors = require("cors");
	const cookieParser = require("cookie-parser");

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
		console.log(`> Server finished booting (${process.env.NODE_ENV})`);
		console.log(`> Server now listening at http://${host}:${port}`);
	});


	// IMPORTS
	const auth = require("./auth/authorize");
	const view = require("./views/view");
	const GET = require("./controllers/get");
	const POST = require("./controllers/post");



	// BACK-END BUSINESS
	app.use(cors());
	app.use(cookieParser(process.env.COOKIES_KEY));
	app.use(express.urlencoded({extended: false}));
	app.use(express.json({extended: false, limit: '1024mb'}));

	app.use(view);
	app.use(auth);

	app.get(/^\/.*/, GET);
	app.post(/^\/.*/, POST);




	require("./_lab"); // My practical laboratory
}
boot();