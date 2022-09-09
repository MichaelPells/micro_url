// IMPORTS
const { accountsDef, passwdsDef, profilesDef, sessionsDef } = require("./table_definitions");
const { DB } = require("../database/scripts/database");
const query = require("../database/queries");

const PASSWDS_TABLE = process.env.PASSWDS_TABLE;

// DEPENDENCIES
const bcrypt = require("bcrypt");



// Utilities
function table_columns(def) {
	var columns = {};

	var data = def.trim().split(",\n");

	for (var column of data) {
		if (
			column.toUpperCase().indexOf("AUTO_INCREMENT") == -1 &&
			column.toUpperCase().indexOf("DEFAULT") == -1 &&
			column.toUpperCase().indexOf("ON UPDATE") == -1
		) {
			var key = column.split(" ")[0];
			columns[key] = column;
		}
	}

	return columns;
}

// Model
class user {
	// Tables Definitions
	static tables = ["accounts", "profiles", PASSWDS_TABLE, "sessions"];
	static basicTables = ["accounts", "profiles", PASSWDS_TABLE, "sessions"];

	static getColumns () {
		var columns = {};

		var defs = [table_columns(accountsDef), table_columns(profilesDef), table_columns(passwdsDef), table_columns(sessionsDef)];

		for (var n = 0; n < this.tables.length; n++) {
			var table = this.tables[n];
			columns[table] = defs[n];
		}

		return columns
	}

	static columns = this.getColumns();

	// Field Requirements
	static minLengths = { // All unspecified VARCHAR fields have minLength of 1
		email: 7,
		handle: 2,
		passwd: 8,
		firstName: 2,
		lastName: 2,
		middleName: 2,
		preNominals: 2,
		hometown: 2,
		stateRegion: 2,
		city: 2,
		phone: 5,
	};

	static maxLengths = { // All unspecified VARCHAR fields have maxLength of 255
		handle: 40,
		firstName: 40,
		lastName: 40,
		middleName: 40,
		preNominals: 40,
		hometown: 40,
		stateRegion: 40,
		city: 40,
		phone: 20,
		penName: 40
	};

	static maxCounts = { // All unspecified JSON fields have infinite maxCount
		emailAddresses: 2,
		socialMedia: 5
	};

	static tests = {
		email: "isEmail",
		emailAddresses: "areEmails",
		handle: "isHandle",
		namePronunciation: "isPath",
		profilePicture: "isPath",
		gender: "isGender",
		DOB: "isDate",
		nationality: "isCountry",
		country: "isCountry",
		languages: "areLanguages",
		phone: "isPhone",
		socialMedia: "areMedia",
		website: "isURL",
		careerQuestionnaires: "wereAsked",
		education: "areEducation",
		work: "areWork"
	}

	static getRequirements() {
		var requirements = {};

		var data = {};

		for (var table of this.tables) {
			var newData = {...this.columns[table]};

			for (var key of Object.keys(newData)) {
				if (!data[key]) {
					data[key] = newData[key];
				}
			}
		}

		for (var key of Object.keys(data)) {
			var specs = data[key].split(" ");
			requirements[key] = {
				required: data[key].toUpperCase().indexOf("NOT NULL")>-1? true : false,
				type: specs[1],
				minLength: this.minLengths[key],
				maxLength: this.maxLengths[key],
				maxCount: this.maxCounts[key],
				test: this.tests[key]
			}
		}

		return requirements;
	}

	static requirements = this.getRequirements();


	// Create a new User	
	constructor(User = {}) {

		this.info = {
			validated: false
		};
		this.data = {};
		this.savedData = {};

		if (User && typeof(User) == "object" && User.email) {
			user.findOne({email: User.email}, (err, data) => {
				if (err) {
					user.caller(this.listeners, "rejected", [err]);
				} else {
					if (!data) { // Create a new user
						// Announce 'new user'
						this.info.existing = false;

						// Remove unknown fields
						var rqs = user.requirements;
						for (var field of Object.keys(User)) {
							if (!rqs[field]) {
								delete User[field];
							}
						}

						// Localize `User` by populating object
						for (var field of Object.keys(User)) {
							this[field] = User[field];
						}
						this.id = 0;
						function rand() {return Math.trunc(Math.random()*10).toString()}
						this.passwd = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand();

						// Do checks (validation)
						this.validate((_) => {}, true);
					}
					else { // Get existing user
						// Announce 'existing user'
						this.info.existing = true;

						// Localize user's data
						for (var field of Object.keys(data)) {
							if (data[field]) {
								this[field] = this.data[field] = this.savedData[field] = data[field];
							}
						}
						

						// Announce validation (validation is automatic for existing users)
						this.info.validated = true;
						user.caller(this.listeners, "validated");
					}
				}
			});
		}
		else {
			// Return error
			user.caller(this.listeners, "rejected", [{name: "RequirementError", message: ["email", "required"], code: "INVALID_USER_DATASET"}]);
		}
	}

	validate (callback, emitEvent = false) {
		return new Promise(async (resolve, reject) => {

			var changes = this.getChanges();
			var changed = Object.keys(changes);

			if (!this.info.validated || changed.length) {
				// Ensure `id` is unchanged
				if (this.info.existing && changes.id) {
					// Announce rejection and Return error
					this.info.validated = false;
					if (emitEvent) {user.caller(this.listeners, "rejected", [{name: "ValidationError", message: "Changes detected in User id. Such field cannot be modified.", code: "CANNOT_VALIDATE_USER"}])}
					if (callback) {callback({name: "ValidationError", message: "Changes detected in User id. Such field cannot be modified.", code: "CANNOT_VALIDATE_USER"})}
					else {reject({name: "ValidationError", message: "Changes detected in User id. Such field cannot be modified.", code: "CANNOT_VALIDATE_USER"})}
				}

				var rqs = user.requirements;
				var errors = [];

				for (var field of Object.keys(rqs)) {

					// Convert all fields to the database-required data type
					if (this[field] && typeof(this[field]) == "object" && rqs[field].type == "JSON") { // Since MySQL stores JSON in binary text format
						try {this[field] = JSON.stringify(this[field])}
						catch (e) {
							errors.push({name: "RequirementError", message: [field, "valid"]});
							delete this[field];
						}
					}
					else if (this[field] != undefined && typeof(this[field]) != "string" && rqs[field].type.includes("VARCHAR")) {
						this[field] = String(this[field]);
					}

					// Remove all null, undefined, or empty fields
					if (!this[field]) {
						delete this[field];
					}
					if (this[field] != undefined && rqs[field].type == "JSON") {
						try {
							if (JSON.parse(this[field]).length == 0) {
								delete this[field];
							}
						}
						catch (e) {
							errors.push({name: "RequirementError", message: [field, "valid"]});
							delete this[field];
						}
					}

					// Check for required fields
					if (rqs[field].required && !this[field]) {
						errors.push({name: "RequirementError", message: [field, "required"]});
					}
	
					// Check for too short data (strings)
					else if (
						this[field] != undefined &&
						rqs[field].minLength &&
						this[field].length < rqs[field].minLength
					) {
						errors.push({name: "RequirementError", message: [field, "minLength"]});
					}
	
					// Check for too long data (strings)
					else if (
						this[field] != undefined &&
						rqs[field].maxLength &&
						this[field].length > rqs[field].maxLength
					) {
						errors.push({name: "RequirementError", message: [field, "maxLength"]});
					}
					else if (
						this[field] != undefined &&
						rqs[field].type.includes("VARCHAR") &&
						this[field].length > 255
					) {
						errors.push({name: "RequirementError", message: [field, "maxLength"]});
					}

					// Check for too long data (JSONs)
					else if (
						this[field] != undefined &&
						rqs[field].maxCount &&
						JSON.parse(this[field]).length > rqs[field].maxCount
					) {
						errors.push({name: "RequirementError", message: [field, "maxCount"]});
					}
	
					// Check for disallowed data in special fields (such as emails, DOBs... and JSON fields)
					else if (
						this[field] != undefined &&
						rqs[field].test &&
						!user.test(this[field], rqs[field].test)
					) {
						errors.push({name: "RequirementError", message: [field, "valid"]});
					}

					// Check if chosen handle is available
					if (this[field] != undefined && field == "handle") {
						var handleUser = await user.findOne({handle: this.handle});
						if (handleUser && handleUser.id != this.id) {
							errors.push({name: "RequirementError", message: ["handle", "available"]});
						}
					}
				}

				if (errors.length) {
					// Announce rejection and Return errors
					this.info.validated = false;
					if (emitEvent) {user.caller(this.listeners, "rejected", [{name: "ValidationError", message: errors, code: "CANNOT_VALIDATE_USER"}])}
					if (callback) {callback({name: "ValidationError", message: errors, code: "CANNOT_VALIDATE_USER"})}
					else {reject({name: "ValidationError", message: errors, code: "CANNOT_VALIDATE_USER"})}
				}
				else {
					// Record new changes into current status (`this.data`)
					for (var field of changed) {
						if (this[field] !== undefined) {
							this.data[field] = this[field];
						} else {
							delete this.data[field];
						}
					}

					// Announce validation
					this.info.validated = true;
					if (emitEvent) {user.caller(this.listeners, "validated")}
					if (callback) {callback(null)}
					resolve();
				}
			}
			else { // Valid already
				// Announce validation
				this.info.validated = true;
				if (emitEvent) {user.caller(this.listeners, "validated")}
				if (callback) {callback(null)}
				resolve();
			}
		});
	}

	// All intervals grouped by info
	listeners = {};

	// Capture event callbacks
	on (infos, callback) {
		try { // In case null is passed as infos - since null is also an object
			if (typeof(infos) != "object") {
				infos = [infos];
			}

			for (var info of infos) {
				if (!this.listeners[info]) {
					this.listeners[info] = [];
				}
				this.listeners[info].push(callback);
			}
		}
		catch (e) {}
	}

	static caller (listeners, info, params = []) {
		setTimeout(() => {
			if (listeners[info]) {
				var callbacks = listeners[info];
				delete listeners[info];
				for (var callback of callbacks) {
					callback(...params);
				}
			}
		});
	}

	static test (value, check) {

		// Validation functions
		function isName(value) {
			return String(value).length >= 2 && String(value).length <= 40;
		}

		function isText(value) {
			return String(value).length >= 2 && String(value).length <= 255;
		}

		function isEmail(value) {
				return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
				.test(String(value).toLowerCase());
		}

		function areEmails(value) {
			value = JSON.parse(value);
			for (var email of value) {
				if (!isEmail(email)) {return false}
			}
			return true;
		}

		function isDate(value) {
			try {value = JSON.parse(value)}
			catch (e) {
				if (!value || typeof(value) != "object") {return false}
			}
			if (value.length != 3) {return false}
			var year = value[2];
			var month = value[1];
			var day = value[0];

			if (!(
				typeof(year) == "number" &&
				typeof(month) == "number" &&
				typeof(day) == "number"
			)) {return false}

			var leap = (year % 4 == 0 && !(year % 100 == 0 && !(year % 400 == 0)));
			var days = [31, leap?29:28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			
			return Boolean(days[month-1] && day > 0 && day <= days[month-1]);
		}

		function isGender(value) {
			return ["male", "female"]
			.includes(value.toLowerCase());
		}

		function isPhone(value) {
			return /^\+\d{10}\d*$/
			.test(value);
		}

		function isHandle(value) {
			return /^[A-za-z0-9][A-Za-z0-9.-]*[A-za-z0-9]$/
			.test(value);
		}

		function isPath(value) {
			try {
				var url = new URL(value, "https://example.com/")
				return true;
			}
			catch(err) {return false}			
		}

		function isURL(value) {
			try {var url = new URL(value)}
			catch(err) {return false}
			return ["http:", "https:"]
			.includes(url.protocol);
			
		}

		function isCountry(value) {
			return true; // Check a match from a list of countries (local or fetched)
		}

		function areLanguages(value) {
			value = JSON.parse(value);
			return true; // Check a match from a list of languages (local or fetched)
		}

		function areMedia(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.name || !isName(value.name)) {return false}
				if (!value.url || !isURL(value.url)) {return false}
				if (!value.username || !isName(value.username)) {return false}
				if (value.profile && !isURL(value.profile)) {return false}
			}
			return true;
		}

		function wereAsked(value) {
			var values = JSON.parse(value);

			return true; // Check if the server indeed previously asked the user these questions
		}

		function areEducation(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.school || !isText(value.school)) {return false}
				if (!value.programme || !isText(value.programme)) {return false}
				if (!value.field || !isText(value.field)) {return false}
				if (value.start && !isDate(value.start)) {return false}
				if (value.end && !isDate(value.end)) {return false}
				if (value.end && !value.start) {return false}
				if (value.title && !isName(value.title)) {return false}
			}
			return true;
		}

		function areWork(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.organization || !isText(value.organization)) {return false}
				if (value.location && !isName(value.location)) {return false}
				if (value.role && !isName(value.role)) {return false}
				if (value.start && !isDate(value.start)) {return false}
				if (value.end && !isDate(value.end)) {return false}
				if (value.end && !value.start) {return false}
				if (value.description && !isText(value.description)) {return false}
			}
			return true;
		}

		function areSkills(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!isName(value)) {return false}
			}
			return true;
		}

		function areCARs(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.name || !isName(value.name)) {return false}
				if (!value.issuer || !isName(value.issuer)) {return false}
				if (value.date && !isDate(value.date)) {return false}
				if (value.expires && !isDate(value.expires)) {return false}
				if (value.url && !isURL(value.url)) {return false}
				if (value.id && !isName(value.id)) {return false}
				if (value.title && !isName(value.title)) {return false}
				// Note that, whether skill is verified or not is not the business of the user while editing profile.
				// It should be done internally in a different logic
			}
			return true;
		}

		function arePROAs(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.title || !isName(value.title)) {return false}
				if (!value.description || !isText(value.description)) {return false}
				if (value.url && !isURL(value.url)) {return false}
			}
			return true;
		}

		function arePublications(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.title || !isName(value.title)) {return false}
				if (value.idType && !isName(value.idType)) {return false}
				if (value.id && !value.idType) {return false}
				if (value.id && !isName(value.id)) {return false}
				if (value.cover && !isPath(value.cover)) {return false}
				if (value.description && !isText(value.description)) {return false}
				if (!(value.coAuthored === undefined) && !(typeof(value.coAuthored) == "boolean")) {return false}
				if (value.url && !isURL(value.url)) {return false}
			}
			return true;
		}

		function areBooks(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!value.title || !isName(value.title)) {return false}
				if (!value.authors || !isText(value.authors)) {return false}
				if (value.readYear && !isDate([1, 1, value.readYear])) {return false}
				if (value.summary && !isText(value.summary)) {return false}
				if (value.idType && !isName(value.idType)) {return false}
				if (value.id && !value.idType) {return false}
				if (value.id && !isName(value.id)) {return false}
				if (value.url && !isURL(value.url)) {return false}
			}
			return true;
		}

		function areHobbies(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!isName(value)) {return false}
			}
			return true;
		}

		function areInterests(value) {
			var values = JSON.parse(value);

			for (value of values) {
				if (!isName(value)) {return false}
			}
			return true;
		}

		if (check == "isEmail") {return isEmail(value)}
		if (check == "areEmails") {return areEmails(value)}
		if (check == "isDate") {return isDate(value)}
		if (check == "isGender") {return isGender(value)}
		if (check == "isPhone") {return isPhone(value)}
		if (check == "isHandle") {return isHandle(value)}
		if (check == "isPath") {return isPath(value)}
		if (check == "isURL") {return isURL(value)}
		if (check == "isCountry") {return isCountry(value)}
		if (check == "areLanguages") {return areLanguages(value)}
		if (check == "areMedia") {return areMedia(value)}
		if (check == "wereAsked") {return wereAsked(value)}
		if (check == "areEducation") {return areEducation(value)}
		if (check == "areWork") {return areWork(value)}
		if (check == "areSkills") {return areSkills(value)}
		if (check == "areCARs") {return areCARs(value)}
		if (check == "arePROAs") {return arePROAs(value)}
		if (check == "arePublications") {return arePublications(value)}
		if (check == "areBooks") {return areBooks(value)}
		if (check == "areHobbies") {return areHobbies(value)}
		if (check == "areInterests") {return areInterests(value)}
	}

	getChanges (prototype = this.data) {
		var changes = {};
		var rqs = user.requirements;

		for (var field of Object.keys(rqs)) {
			if (prototype[field] !== undefined || this[field] !== undefined) {
				if (this[field] !== prototype[field]) {
					changes[field] = this[field];
				}
			}
		}
		return changes;
	}

	reload (callback) {
		return new Promise((resolve, reject) => {

			// re-get an existing user
			if (this.info.existing) {
				user.findOne({email: this.savedData.email}, (error, data) => {
					if (error) {
						if (callback) {callback(error)}
						else {reject(error)}
					} else {
						if (data) {
							// Localize user's data
							for (var field of Object.keys(data)) {
								if (data[field]) {
									this[field] = this.data[field] = this.savedData[field] = data[field];
								}
							}

							// Announce validation (validation is automatic for existing users)
							this.info.validated = true;

							if (callback) {callback(null)}
							resolve();
						}
						else { // User does not exist (may be no longer)
							// Announce 'non-existing user'
							this.info.existing = false;

							if (callback) {callback(null)}
							resolve();
						}
					}
				});
			}
			else {
				if (callback) {callback(null)}
				resolve();
			}
		});
	}

	parseJSON () {
		var rqs = user.requirements;
		
		for (var field of Object.keys(rqs)) {
			if (this[field] && rqs[field].type == "JSON" && typeof(this[field]) == "string") {
				try {this[field] = JSON.parse(this[field])}
				catch (e) {}
			}
		}
	}

	stringifyJSON () {
		var rqs = user.requirements;
		
		for (var field of Object.keys(rqs)) {
			if (this[field] && rqs[field].type == "JSON" && typeof(this[field]) == "object") {
				try {this[field] = JSON.stringify(this[field])}
				catch (e) {}
			}
		}
	}

	update (data = {}, callback) {
		return new Promise((resolve, reject) => {

			// Remove unknown fields
			var rqs = user.requirements;
			for (var field of Object.keys(data)) {
				if (!rqs[field]) {
					delete data[field];
				}
			}

			// Localize `data`
			for (var field of Object.keys(data)) {
				this[field] = data[field];
			}

			// Do checks (validation)
			this.validate((error) => {
				if (error) {
					if (callback) {callback(error)}
					else {reject(error)}
				} else {
					if (callback) {callback(null)}
					resolve();
				}
			});
		});
	}

	undo (fields = [], callback, source = this.data) {
		return new Promise((resolve, reject) => {

			var rqs = user.requirements;

			for (var field of fields) {
				if (rqs[field]) {
					if (source[field] !== undefined) {
						this[field] = source[field];
					} else {
						delete this[field];
					}
				}
			}

			// Do checks (validation)
			this.validate((error) => {
				if (error) {
					if (callback) {callback(error)}
					else {reject(error)}
				} else {
					if (callback) {callback(null)}
					resolve();
				}
			});
		});
	}

	undoAll (callback) {
		return new Promise((resolve, reject) => {

			var rqs = user.requirements;
			var all = Object.keys(rqs);
			
			// Use `undo`
			this.undo(all, (error) => {
				if (error) {
					if (callback) {callback(error)}
					else {reject(error)}
				} else {
					if (callback) {callback(null)}
					resolve();
				}
			});
		});
	}
	
	discard (fields = [], callback) {
		return new Promise((resolve, reject) => {
			
			// Use `undo`
			this.undo(fields, (error) => {
				if (error) {
					if (callback) {callback(error)}
					else {reject(error)}
				} else {
					if (callback) {callback(null)}
					resolve();
				}
			},
			this.savedData);
		});
	}

	discardAll (callback) {
		return new Promise((resolve, reject) => {

			var rqs = user.requirements;
			var all = Object.keys(rqs);
			
			// Use `undo`
			this.undo(all, (error) => {
				if (error) {
					if (callback) {callback(error)}
					else {reject(error)}
				} else {
					if (callback) {callback(null)}
					resolve();
				}
			},
			this.savedData);
		});
	}

	// Save into Database
	save (callback, tryValidation = true) {
		return new Promise(async (resolve, reject) => {

			if (this.info.validated && Object.keys(this.getChanges()).length == 0) { // If there are no unvalidated changes
				if (!this.info.existing) {  // Create new user in database
					var thisUser = this;
					thisUser.id = thisUser.data.id = await this.genId();
					thisUser.status = thisUser.data.status = JSON.stringify({name: "UNCONFIRMED", details: "new account"});

					var salt = await bcrypt.genSalt(10);
					var passwd;
					
					async function saveToDB(tables) {
						var table = tables[0];
						var User = {};

						for (var field of Object.keys(thisUser)) {
							if (user.columns[table][field]) {
								User[field] = thisUser[field];
							}
						}

						// Hash `passwd`
						if (User.passwd) {
							User.passwd = await bcrypt.hash(User.passwd + table, salt);
							if (table == user.tables[0]) {passwd = User.passwd}
						}
						
						var fields = Object.keys(User);
						var data = Object.values(User);

						var QUERY = query.createUser
						.replace("@", table)
						.replace("@", fields.join(", "))
						.replace("@", fields.map((_) => {return "?"}).join(", "));
			
						DB.query(QUERY, data, (err, _) => {
							if (err) {
								// Delete any already-written record from all tables
								thisUser.delete()
								.catch((_) => {});
								
								if (callback) {callback(err)}
								else {reject(err)}
							} else {
								tables.splice(table, 1);
								if (tables.length) {
									saveToDB(tables);
								} else {
									// Record new 'save changes' into current 'save status' (`this.savedData`)
									thisUser.savedData = {...thisUser.data};
									thisUser.passwd = thisUser.data.passwd = thisUser.savedData.passwd = passwd;

									// Announce 'now existing user'
									thisUser.info.existing = true;

									if (callback) {callback(null)}
									resolve();
								}
							}
						});
					}

					saveToDB([...user.tables]);
				}

				else { // Update existing user in database
					var changes = this.getChanges(this.savedData);
					var changed = Object.keys(changes);
		
					if (changed.length) { // Changes made
						var thisUser = this;

						if (changed.includes("password")) { // Change `passwd` as well, if `password` gets changed
							changed.push("passwd");
							function rand() {return Math.trunc(Math.random()*10).toString()}
							changes.passwd = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand();

							var salt = await bcrypt.genSalt(10);
							var passwd;
						}

						var errors = [];

						async function saveToDB(tables) {
							var table = tables[0];
							var User = {};

							for (var field of changed) {
								if (user.columns[table][field]) {
									User[field] = changes[field];
								}
							}

							// Hash `passwd`
							if (User.passwd && changed.includes("password")) {
								User.passwd = await bcrypt.hash(User.passwd + table, salt);
								if (table == user.tables[0]) {passwd = User.passwd}
							}
							
							var fields = Object.keys(User);
							if (fields.length) { // If there are fields to save in this table
								var data = Object.values(User);

								var QUERY = query.updateUser
								.replace("@", table)
								.replace("@", fields.map((field) => {return `${field} = ?`}).join(", "));
					
								DB.query(QUERY, [...data, thisUser.id], (err, _) => {
									if (err) {									
										errors.push(err);
									}
									tables.splice(table, 1);
									if (tables.length) {
										saveToDB(tables);
									} else {
										if (errors.length) {
											if (callback) {callback({name: "SaveError", message: errors, code: "SOME_TABLE_UPDATES_FAILED"})}
											else {reject(errors)}
										} else {
											// Record new 'save changes' into current 'save status' (`this.savedData`)
											thisUser.savedData = {...thisUser.data}
											if (changed.includes("password")) {thisUser.passwd = thisUser.data.passwd = thisUser.savedData.passwd = passwd}

											if (callback) {callback(null)}
											resolve();
										}
									}
								});
							}
							else { // If there are no fields to save in this table
								tables.splice(table, 1);
								if (tables.length) {
									saveToDB(tables);
								} else {
									if (errors.length) {
										if (callback) {callback({name: "SaveError", message: errors, code: "SOME_TABLE_UPDATES_FAILED"})}
										else {reject(errors)}
									} else {
										// Record new 'save changes' into current 'save status' (`this.savedData`)
										thisUser.savedData = {...thisUser.data};

										if (callback) {callback(null)}
										resolve();
									}
								}	
							}
						}

						saveToDB([...user.tables]);
					}
					else { // No changes made
						if (callback) {callback(null)}
						resolve();
					}
				}
			}
			
			else if (tryValidation) {
				// Do checks (automatic validation)
				this.validate((error) => {
					if (error) {
						if (callback) {callback(error)}
						else {reject(error)}
					} else {
						this.save((error) => {
							if (error) {
								if (callback) {callback(error)}
								else {reject(error)}
							} else {
								if (callback) {callback(null)}
								resolve();
							}
						}, false);
					}
				});
			}
			
			else {
				if (callback) {callback({name: "SaveError", message: "User not validated, and `tryValidate` is explicitly set to `false`", code: "CANNOT_SAVE_USER"})}
				else {reject({name: "SaveError", message: "User not validated, and `tryValidate` is explicitly set to `false`", code: "CANNOT_SAVE_USER"})}
			}
		});
	}

	genId (callback, last) {
		return new Promise((resolve, reject) => {

			function rand() {return Math.trunc(Math.random()*10).toString()}
			var string = this.firstName + this.lastName + this.middleName + this.email;
			
			if (last) {
				last = last.slice(6, last.length - 3);

				var length = (string.length + Number(rand() + rand())).toString().padStart(3, rand());
				var time = new Date().getMilliseconds().toString().padStart(3, "0");
				var now = (Number(last) + 1).toString();
				var float = rand() + rand() + rand();

				var id = length + time + now + float; // 6-x*-3

				if (callback) {callback(null, id)}
				resolve(id);
			}
			else {
				DB.query(`SELECT id FROM ${user.tables[0]} ORDER BY entry DESC LIMIT 1`, (err, data) => {
					if (err) {
						if (callback) {callback(err, null)}
						else {reject(err)}
					} else {
						if (data.length) {var last = data[0].id.slice(6, data[0].id.length - 3)}
						else {var last = "0"} // Behold, our first user!
	
						var length = (string.length + Number(rand() + rand())).toString().padStart(3, rand());
						var time = new Date().getMilliseconds().toString().padStart(3, "0");
						var now = (Number(last) + 1).toString();
						var float = rand() + rand() + rand();
	
						var id = length + time + now + float; // 6-x*-3
	
						if (callback) {callback(null, id)}
						resolve(id);
					}
				});
			}
		});
	}

	delete (callback) {
		return new Promise((resolve, reject) => {

			if (this.info.validated && Object.keys(this.getChanges()).length == 0) { // I guess to be sure we are deleting the intended user, plus we would be using a certain unique field from `this`
				var thisUser = this;

				function deleteFromDB(tables) {
					var table = tables[0];
					
					var QUERY = query.deleteUser
					.replace("@", table)

					DB.query(QUERY, thisUser.id, (err, _) => {
						if (err) {
							if (callback) {callback(err)}
							else {reject(err)}
						} else {
							tables.splice(table, 1);
							if (tables.length) {
								deleteFromDB(tables);
							} else {
								// Announce 'non-existing user'
								thisUser.info.existing = false;

								if (callback) {callback(null)}
								resolve();
							}
						}
					});
				}

				deleteFromDB([...user.tables].reverse());
			}
			else {
				if (callback) {callback({code: "USER_NOT_VALIDATED"})}
				else {reject({code: "USER_NOT_VALIDATED"})}
			}
		});
	}

	get (columns) {
		data = {}

		for (var field of columns) {
			data[field] = this[field];
		}

		return data;
	}

	static getOne(columns = ["*"], User = {id: ""}, callback) {
		return new Promise((resolve, reject) => {

			// Use only the first given key/value pair
			var field = Object.keys(User)[0];

			if (
				field == "id" ||
				field == "email" ||
				field == "handle"
			) { // Unique search can only be done with a unique field

				columns = columns.join(", ");

				// To ensure each entry refers to the same user across tables
				var tables = [...user.basicTables];
				var uniqueMatches = [];
				for (var table of tables) {
					if (table !== tables[0]) {
						uniqueMatches.push(`${tables[0]}.id = ${table}.id`);
					}
				}
				uniqueMatches = `${uniqueMatches.join(" AND ")} AND ${tables[0]}.`;
				var table = tables.join(", ");

				var QUERY = query.findUser
				.replace("@", columns)
				.replace("@", table)
				.replace("@", uniqueMatches)
				.replace("@", field);

				DB.query(QUERY, User[field], (err, data) => {
					if (err) {
						if (callback) {callback(err, null)}
						else {reject(err)}
					} else {
						if (data.length) {
							if (callback) {callback(null, data[0])}
							resolve(data[0]);
						} else {
							if (callback) {callback(null, null)}
							resolve(null);
						}
					}
				});
			}
			else {
				if (callback) {callback({code: "NO_UNIQUE_KEY_SPECIFIED"}, null)}
				else {reject({code: "NO_UNIQUE_KEY_SPECIFIED"})}
			}

		});
	}

	static getMany(columns = ["*"], User = {id: ""}, params = {}, callback) {
		return new Promise((resolve, reject) => {

			// Use given selection parameters such as ORDER BY, LIMIT and OFFSET
			var findParams = [];
			for (var param of Object.keys(params)) {
				findParams.push(`${param.toUpperCase()} ${params[param]}`);
			}
			findParams = findParams.join(" ");

			// Use and exclude given logic if any
			var logic = User["<logic>"];
			if (logic) {delete User["<logic>"]}

			var fields = Object.keys(User);
			var vals = [];

			if (logic) { // Use logic instead of order
				// Find all logical operands (<%>) and array their values in `vals` based on given logic
				vals = logic.match(/<[1-9]+>/g).map((condition) => {
					var i = condition.slice(1, condition.length - 1) - 1;
					var field = fields[i];

					if (!User[field] || typeof(User[field]) != "object") { // Needs conversion to Array (Aside: null is also an object)
						User[field] = ["=", User[field]];
					}

					return User[field][1];
				});

				// Refactor all conditions for database query
				var conditionsList = fields.map((field) => {return `${field} ${User[field][0]} ?`});

				// Find all logical operands (<%>) and array all conditions based on given logic
				var conditions  = logic;
				for (var n = 0; n < conditionsList.length; n++) {
					conditions = conditions.replace(RegExp(`<${n+1}>`, "g"), conditionsList[n]);
				}
			} else { // Use order instead of logic (undefined)
				for (var field of fields) {
					if (!User[field] || typeof(User[field]) != "object") { // Needs conversion to Array (Aside: null is also an object)
						User[field] = ["=", User[field]];
					}
					vals.push(User[field][1]);
				}
				// Refactor all conditions for database query
				var conditions = fields.map((field) => {return `${field} ${User[field][0]} ?`}).join(" AND ");
			}

			columns = columns.join(", ");

			// To ensure each entry refers to the same user across tables
			var tables = [...user.basicTables];
			var uniqueMatches = [];
			for (var table of tables) {
				if (table !== tables[0]) {
					uniqueMatches.push(`${tables[0]}.id = ${table}.id`);
				}
			}
			uniqueMatches = `${uniqueMatches.join(" AND ")} AND `;
			var table = tables.join(", ");

			var QUERY = query.findManyUsers
			.replace("@", columns)
			.replace("@", table)
			.replace("@", uniqueMatches)
			.replace("@", conditions)
			.replace("@", findParams? findParams : "");

			DB.query(QUERY, vals, (err, data) => {
				if (err) {
					if (callback) {callback(err, null)}
					else {reject(err)}
				} else {
					if (callback) {callback(null, data)}
					resolve(data);
				}
			});
		});
	}

	static findOne (User = {id: ""}, callback) {
		return new Promise((resolve, reject) => {
			
			// Use `getOne`
			user.getOne(["*"], User, (error, data) => {
				if (error) {
					if (callback) {callback(error, data)}
					else {reject(error)}
				} else {
					if (callback) {callback(error, data)}
					resolve(data);
				}
			});
		});
	}

	static findMany (User = {id: ""}, params = {}, callback) {
		return new Promise((resolve, reject) => {
			
			// Use `getMany`
			user.getMany(["*"], User, params, (error, data) => {
				if (error) {
					if (callback) {callback(error, data)}
					else {reject(error)}
				} else {
					if (callback) {callback(error, data)}
					resolve(data);
				}
			});
		});
	}

	static createMany (users, callback) {
		return new Promise((resolve, reject) => {

			var fails = [];
			var Users = [];

			var last;

			function validate(n) {
				var data = users[n];

				function rand() {return Math.trunc(Math.random()*10).toString()}
				data.password = rand() + rand() + rand() + rand() + rand() + rand() + rand() + rand();
				// Account status would be set to "UNACTIVATED"
				// Accounts marked "UNACTIVATED" cannot be logged into, except by first activating account via personal email link
				// This is why less care is given to passwording batch-created accounts

				var User = new user(data);
				User.on("validated", async () => {
					if (!User.info.existing) {
						if (!Users.length) {last = User.id = await User.genId()}
						else {last = User.id = await User.genId(undefined, last)}
						User.status = JSON.stringify({name: "UNACTIVATED", details: "incomplete setup"});
						Users.push(User);
					} else {
						fails.push(User);
					}
					next(n);
				});
				User.on("rejected", () => {
					fails.push(User);
					next(n);
				});
			}
			validate(0);

			function next(n) {
				if (n < users.length - 1) { // Are there yet more users to validate?
					validate(n + 1);
				} else { // Begin saving to database
					if (Users.length) {
						function saveToDB(tables) {
							var table = tables[0];

							var fields = [];

							var rqs = user.requirements;
							for (var field of Object.keys(rqs)) {
								if (user.columns[table][field] && rqs[field].required) {
									fields.push(field);
								}
							}
							if (user.columns[table]["status"]) {fields.push("status")}

							var valuesPH = `(${fields.map((_) => {return "?"}).join(", ")})`;
							var QUERY = query.creatManyUsers
							.replace("@", table)
							.replace("@", fields.join(", "))
							.replace("@", Users.map((_) => {return valuesPH}).join(", "));

							var data = [];

							for (var User of Users) {
								for (var field of fields) {
									data.push(User[field]);
								}
							}
				
							DB.query(QUERY, data, (err, _) => {
								if (err) {
									if (callback) {callback(err, fails)}
									else {reject(err)}
								} else {
									tables.splice(table, 1);
									if (tables.length) {
										saveToDB(tables);
									} else {
										if (callback) {callback(null, fails)}
										resolve(fails);
									}
								}
							});
						}

						saveToDB([...user.tables]);
					}
					else {
						if (callback) {callback(null, fails)}
						resolve(fails);
					}
				}
			}
		});
	}
}

module.exports = user;


// // On event listener (for validated, saved etc)
// on (info, callback) {
// 	var interval = setInterval(() => {
// 		if (this.info[info]) {
// 			callback();
// 			clearInterval(interval);
// 			this.listeners[info].splice(interval, 1);
// 		}
// 	}, 0);

// 	if (!this.listeners[info]) {
// 		this.listeners[info] = [];
// 	}
// 	this.listeners[info].push(interval);
// }

// // Event listener killer
// end (infos = Object.keys(this.listeners)) {
// 	if (typeof(infos) != "object") {
// 		infos = [infos]
// 	}

// 	for (var info of infos) {
// 		var intervals = this.listeners[info];

// 		for (var interval of intervals) {
// 			clearInterval(interval);
// 			this.listeners[info].splice(interval, 1);
// 		}
// 	}
// }

// Validate better