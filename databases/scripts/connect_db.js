console.log("Connecting to database...")

// IMPORTS
const ready = require("../../comm");

// DEPENDENCIES
const mysql = require("mysql");

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

const connection = mysql.createConnection({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASS,
});

connection.connect((err) => {
	if (err) {
		console.log(`Error Connecting to Database: ${err.message}`);
		console.log("Exiting...");
		process.exit(1);
	} else {
		console.log("Database Connected");
		ready.connect_db = true;
	}
});


module.exports = connection;