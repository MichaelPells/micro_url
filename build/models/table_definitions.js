"use strict";
exports.URLsDef = `
entry						BIGINT UNSIGNED	AUTO_INCREMENT		UNIQUE KEY	,
createdOn					DATETIME		DEFAULT NOW()					,
updatedOn					DATETIME		ON UPDATE NOW()					,
owner						VARCHAR(255)	NOT NULL						,
short						VARCHAR(255)	NOT NULL			PRIMARY KEY	,
url							VARCHAR(255)	NOT NULL
`
    .replace(/	+/g, " ").replace(/ +,/g, ",");
