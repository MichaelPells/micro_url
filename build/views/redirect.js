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
var { REDIRECT, INTERNAL_SERVER_ERROR, NOT_FOUND } = require("../utilities/status_codes");
function redirect(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const link = yield Link.findOne(req.params.short);
            if (link) {
                res.statusCode = REDIRECT;
                res.redirect(link.url);
            }
            else {
                var response = {
                    error: { message: "Page not found" },
                    data: null
                };
                res.statusCode = NOT_FOUND;
                res.setHeader("Content-Type", "application/json");
                res.send(response);
            }
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
module.exports = redirect;
