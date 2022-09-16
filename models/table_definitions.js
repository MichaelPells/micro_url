exports.accountsDef = `
entry						BIGINT UNSIGNED	AUTO_INCREMENT		UNIQUE KEY	,
createdOn					DATETIME		DEFAULT NOW()					,
status						JSON			NULL							,
id							VARCHAR(255)	NOT NULL			PRIMARY KEY	,
email						VARCHAR(255)	NOT NULL			UNIQUE KEY	,
handle						VARCHAR(255)	NULL				UNIQUE KEY	,
passwd						VARCHAR(255)	NOT NULL
`
.replace(/	+/g, " ").replace(/ +,/g, ",");


exports.passwdsDef = `
entry		 				BIGINT UNSIGNED AUTO_INCREMENT		UNIQUE KEY	,
changedOn					DATETIME		ON UPDATE NOW()					,
id							VARCHAR(255)	NOT NULL			PRIMARY KEY	,
password					VARCHAR(255)	NOT NULL
`
.replace(/	+/g, " ").replace(/ +,/g, ",");


exports.profilesDef = `
entry		 				BIGINT UNSIGNED AUTO_INCREMENT		UNIQUE KEY	,
updatedOn					DATETIME		ON UPDATE NOW()					,
id							VARCHAR(255)	NOT NULL			PRIMARY KEY	,
handle						VARCHAR(255)	NULL				UNIQUE KEY	,
firstName					VARCHAR(255)	NOT NULL						,
lastName					VARCHAR(255)	NOT NULL						,
middleName					VARCHAR(255)	NULL							,
namePronunciation			VARCHAR(255)	NULL							,
preNominals					VARCHAR(255)	NULL							,
gender						VARCHAR(255)	NOT NULL						,
DOB							JSON			NOT NULL						,
nationality					VARCHAR(255)	NOT NULL						,
hometown					VARCHAR(255)	NULL							,
languages					JSON			NULL							,
profilePicture				VARCHAR(255)	NULL							,
about						VARCHAR(255)	NULL							,
country						VARCHAR(255)	NOT NULL						,
stateRegion					VARCHAR(255)	NULL							,
city						VARCHAR(255)	NULL							,
phone						VARCHAR(255)	NULL							,
emailAddresses				JSON			NULL							,
socialMedia					JSON			NULL							,
website						VARCHAR(255)	NULL							,
careerGoals					VARCHAR(255)	NULL							,
careerQuestionnaires		JSON			NULL							,
education					JSON			NULL							,
work						JSON			NULL							,
skills						JSON			NULL							,
CARs						JSON			NULL							,
PROAs						JSON			NULL							,
publications				JSON			NULL							,
penName						VARCHAR(255)	NULL							,
readBooks					JSON			NULL							,
hobbies						JSON			NULL							,
interests					JSON			NULL
`
.replace(/	+/g, " ").replace(/ +,/g, ",");


exports.sessionsDef = `
entry		 				BIGINT UNSIGNED AUTO_INCREMENT		UNIQUE KEY	,
id							VARCHAR(255)	NOT NULL			PRIMARY KEY	,
sessionLogs					JSON			NULL							,
lastLoggedIn				DATETIME		NULL							,
lastSeen					DATETIME		NULL
`
.replace(/	+/g, " ").replace(/ +,/g, ",");