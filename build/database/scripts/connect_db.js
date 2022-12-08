"use strict";
// IMPORTS
var mysql = require("mysql");
// DEPENDENCIES
var database = require("./database");
module.exports = new Promise((resolve) => {
    const DB_HOST = process.env.DB_HOST;
    const DB_USER = process.env.DB_USER;
    const DB_PASS = process.env.DB_PASS;
    const DB_NAME = process.env.DB_NAME;
    const connection = mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME
    });
    connection.connect((err) => {
        if (err) {
            console.log(`Error Connecting to Database: ${err.message}`);
            console.log("Exiting...");
            process.exit(1);
        }
        else {
            database.DB = connection;
            resolve(null);
        }
    });
});
