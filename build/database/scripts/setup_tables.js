"use strict";
// IMPORTS
const { DB } = require("./database");
const { URLsDef } = require("../../models/table_definitions");
module.exports = new Promise((resolve) => {
    DB.query(`CREATE TABLE IF NOT EXISTS URLs (${URLsDef})`, (err) => {
        if (err) {
            console.log(`Error Creating a Table: ${err.message}`);
            console.log("Exiting...");
            process.exit(1);
        }
        else {
            resolve(null);
        }
    });
});
