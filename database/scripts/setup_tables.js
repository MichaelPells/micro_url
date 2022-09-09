// IMPORTS
const { DB } = require("./database");
const { accountsDef, passwdsDef, profilesDef, sessionsDef } = require("../../models/table_definitions");



module.exports = new Promise((resolve) => {
	const PASSWDS_TABLE = process.env.PASSWDS_TABLE;

	DB.query(`CREATE TABLE IF NOT EXISTS accounts (${accountsDef})`, (err, _) => {
		if (err) {
			console.log(`Error Creating a Table: ${err.message}`);
			console.log("Exiting...");
			process.exit(1);
		}
	});

	DB.query(`CREATE TABLE IF NOT EXISTS ${PASSWDS_TABLE} (${passwdsDef})`, (err, _) => {
		if (err) {
			console.log(`Error Creating a Table: ${err.message}`);
			console.log("Exiting...");
			process.exit(1);
		}
	});

	DB.query(`CREATE TABLE IF NOT EXISTS profiles (${profilesDef})`, (err, _) => {
		if (err) {
			console.log(`Error Creating a Table: ${err.message}`);
			console.log("Exiting...");
			process.exit(1);
		}
	});

	DB.query(`CREATE TABLE IF NOT EXISTS sessions (${sessionsDef})`, (err, _) => {
		if (err) {
			console.log(`Error Creating a Table: ${err.message}`);
			console.log("Exiting...");
			process.exit(1);
		} else {
			resolve();
		}
	});
});