console.log("Setting up database...")

// IMPORTS
const DB = require("./connect_db");
const ready = require("../../comm");


DB_NAME = process.env.DB_NAME;

DB.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`, (err, _) => {
	if (err) {
		console.log(`Error Creating Database: ${err.message}`);
		console.log("Exiting...");
		process.exit(1);
	}
});

DB.query(`USE ${DB_NAME}`, (err, _) => {
	if (err) {
		console.log(`Error Using Database: ${err.message}`);
		console.log("Exiting...");
		process.exit(1);
	} else {
		ready.create_db = true;
	}
});