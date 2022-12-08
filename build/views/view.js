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
var { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST } = require("../utilities/status_codes");
function view(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const short = req.query.short;
        const owner = req.query.owner;
        try {
            if (short) {
                var data = yield Link.findOne(short);
            }
            else if (owner) {
                var data = yield Link.findMany(owner);
            }
            else {
                var response = {
                    error: { message: "No search parameter given" },
                    data: null
                };
                res.statusCode = BAD_REQUEST;
                res.setHeader("Content-Type", "application/json");
                res.send(response);
                return;
            }
            var response = {
                error: null,
                data: data
            };
            res.statusCode = OK;
            res.setHeader("Content-Type", "application/json");
            res.send(response);
        }
        catch (err) {
            var response = {
                error: { message: "Internal Server Error" },
                data: null
            };
            res.statusCode = INTERNAL_SERVER_ERROR;
            res.setHeader("Content-Type", "application/json");
            res.send(response);
            console.log(err);
        }
    });
}
module.exports = view;
