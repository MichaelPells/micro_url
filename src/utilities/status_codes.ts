enum status_codes {
	OK = 200,
	CREATED = 201,
	REDIRECT = 302,
	BAD_REQUEST = 400,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	METHOD_NOT_ALLOWED = 405,
	INTERNAL_SERVER_ERROR = 500
}

module.exports = { ...status_codes }