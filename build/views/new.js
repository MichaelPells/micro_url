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
// IMPORTS
var Link = require("../models/link_model");
var { CREATED, INTERNAL_SERVER_ERROR, FORBIDDEN, BAD_REQUEST } = require("../utilities/status_codes");
function create(req, res) {
    const data = {
        owner: req.query.owner,
        short: req.query.short,
        url: req.query.url
    };
    const link = new Link(data);
    link.on("validated", () => __awaiter(this, void 0, void 0, function* () {
        if (!link.info.existing) { // If link does not already exist
            try {
                yield link.save();
                var response = {
                    error: null,
                    data: "Short URL created successfully"
                };
                res.statusCode = CREATED;
                res.setHeader("Content-Type", "application/json");
                res.send(response);
            }
            catch (err) { // Error must be due to server.
                var response = {
                    error: { message: "Internal Server Error" },
                    data: null
                };
                res.statusCode = INTERNAL_SERVER_ERROR;
                res.setHeader("Content-Type", "application/json");
                res.send(response);
                console.log(err);
            }
        }
        else { // If link exists
            var response = {
                error: { message: "Short URL already taken" },
                data: null
            };
            res.statusCode = FORBIDDEN;
            res.setHeader("Content-Type", "application/json");
            res.send(response);
        }
    }));
    link.on("rejected", (err) => {
        var response = {
            error: err,
            data: null
        };
        res.statusCode = BAD_REQUEST;
        res.setHeader("Content-Type", "application/json");
        res.send(response);
    });
}
module.exports = create;
