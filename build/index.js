"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// SETTINGS
require("dotenv").config();
const host = "localhost";
const port = process.env.PORT || 5000;
// BOOT PROCESS
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("> Server booting");
        // DEPENDENCIES
        const express = require("express");
        const cors = require("cors");
        console.log("> Server looking for required environment variables");
        require("./init_env");
        console.log("> Server setting up database");
        yield require("./database/scripts/create_db");
        console.log("> Server connecting to database");
        yield require("./database/scripts/connect_db");
        console.log("> Server setting up tables");
        yield require("./database/scripts/setup_tables");
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
        app.use(express.json({ extended: false, limit: '1024mb' }));
        app.get("/new", NEW);
        app.get("/view", VIEW);
        app.get("/change", CHANGE);
        app.get("/remove", REMOVE);
        app.get("/:short", REDIRECT);
    });
}
main();
