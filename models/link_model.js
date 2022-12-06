// IMPORTS
const { DB } = require("../database/scripts/database");
const query = require("../database/queries");


class Link {
	constructor (link = {}) {
		this.info = {};

		if (link && typeof(link) == "object" && link.short) {

			Link.findOne(link.short, (err, data) => {
				if (err) {
					Link.caller(this.listeners, "rejected", [err]);
				} else {
					if (!data) { // Create a new link
						// Announce 'new link'
						this.info.existing = false;

						this.owner = link.owner;
						this.short = link.short;
						this.url = link.url;

						// Do checks (validation)
						const valid = this.validate();
						if (valid.valid) { // Announce validation (validation is automatic for existing links)
							Link.caller(this.listeners, "validated");
						}
						else { // Announce error
							Link.caller(this.listeners, "rejected", [{name: "ValidationError", message: valid.errors}]);
						}
					}
					else { // Get existing link
						// Announce 'existing link'
						this.info.existing = true;

						this.entry = data.entry;
						this.createdOn = data.createdOn;
						this.updatedOn = data.updatedOn;
						this.owner = data.owner;
						this.short = data.short;
						this.url = data.url;

						// Announce validation (validation is automatic for existing links)
						Link.caller(this.listeners, "validated");
					}
				}
			});
		}

		else {
			// Return error
			Link.caller(this.listeners, "rejected", [{name: "RequirementError", message: ["short", "required"]}]);
		}
	}

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

	validate () {
		const errors = [];

		if (!this.owner) {
			errors.push(["owner", "null"]);
		} else if (this.owner.length < 2 || this.owner.length > 40) {
			errors.push(["owner", "too long or short"]);
		}

		if (!this.short) {
			errors.push(["short", "null"]);
		} else if (this.short.length < 1 || this.short.length > 40) {
			errors.push(["short", "too long or short"]);
		} else if (!this.short.match(/^[0-9A-Za-z-_.]+$/)) {
			errors.push(["short", "invalid"]);
		} else if (["new", "view", "change", "remove"].includes(this.short)) {
			errors.push(["short", "taken"]);
		}

		if (!this.url) {
			errors.push(["url", "null"]);
		} else if (this.url.length < 1) {
			errors.push(["url", "too short"]);
		} else {
			try {new URL(this.url)}
			catch(e) {errors.push(["url", "invalid"]);}
		}

		if (errors.length) {
			return ({valid: false, errors: errors});
		}

		return ({valid: true, errors: null});
	}

	update (data = {}) {
		this.owner = data.owner || this.owner;
		this.short = data.short || this.short;
		this.url = data.url || this.url;

		// Do checks (validation)
		const valid = this.validate();

		if (!valid.valid) { // Throw error
			throw {name: "ValidationError", message: valid.errors};
		}
	}
	
	save (callback) {
		return new Promise(async (resolve, reject) => {
			if (!this.info.existing) {
				const QUERY = query.createLink;
				const data = [this.owner, this.short, this.url]

				DB.query(QUERY, data, (err, _) => {
					if (err) { // If error
						if (callback) {callback(err)}
						else {reject(err)}
					} else { // If sucessful
						if (callback) {callback(null)}
						resolve();
					}
				});
			}

			else {
				const QUERY = query.updateLink;
				const data = [this.owner, this.short, this.url, this.entry]

				DB.query(QUERY, data, (err, _) => {
					if (err) { // If error
						if (callback) {callback(err)}
						else {reject(err)}
					} else { // If sucessful
						if (callback) {callback(null)}
						resolve();
					}
				});
			}

		});
	}

	delete (callback) {
		return new Promise(async (resolve, reject) => {

			const QUERY = query.deleteLink;

			DB.query(QUERY, this.short, (err, _) => {
				if (err) { // If error
					if (callback) {callback(err)}
					else {reject(err)}
				} else { // If sucessful
					if (callback) {callback(null)}
					resolve();
				}
			});
		});
	}

	static findOne (short, callback) {
		return new Promise(async (resolve, reject) => {

			const QUERY = query.findLink;

			DB.query(QUERY, short, (err, data) => {
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
		});
	}

	static findMany (owner, callback) {
		return new Promise(async (resolve, reject) => {

			const QUERY = query.findManyLinks;

			DB.query(QUERY, owner, (err, data) => {
				if (err) {
					if (callback) {callback(err, null)}
					else {reject(err)}
				} else {
					if (data.length) {
						if (callback) {callback(null, data)}
						resolve(data);
					} else {
						if (callback) {callback(null, null)}
						resolve(null);
					}
				}
			});
		});
	}
}

module.exports = Link;