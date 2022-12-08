"use strict";
var status_codes;
(function (status_codes) {
    status_codes[status_codes["OK"] = 200] = "OK";
    status_codes[status_codes["CREATED"] = 201] = "CREATED";
    status_codes[status_codes["REDIRECT"] = 302] = "REDIRECT";
    status_codes[status_codes["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    status_codes[status_codes["FORBIDDEN"] = 403] = "FORBIDDEN";
    status_codes[status_codes["NOT_FOUND"] = 404] = "NOT_FOUND";
    status_codes[status_codes["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
    status_codes[status_codes["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(status_codes || (status_codes = {}));
module.exports = Object.assign({}, status_codes);
