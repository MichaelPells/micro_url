// IMPORTS

// DEPENDENCIES
var mysql = require("mysql");


module.exports = new Promise((resolve) => {
	const DB_HOST = process.env.DB_HOST;
	const DB_USER = process.env.DB_USER;
	const DB_PASS = process.env.DB_PASS;
	const DB_NAME = process.env.DB_NAME;
	
	const connection = mysql.createConnection({
		host: DB_HOST,
		user: DB_USER,
		password: DB_PASS,
	});
	
	connection.connect((err: Error) => {
		if (err) {
			console.log(`Error Connecting to Database Server: ${err.message}`);
			console.log("Exiting...");
			process.exit(1);
		} else {
			connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`, (err: Error) => {
				if (err) {
					console.log(`Error Creating Database: ${err.message}`);
					console.log("Exiting...");
					process.exit(1);
				} else {
					resolve(null);
				}
			});
		}
	});
});