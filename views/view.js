// IMPORTS
const views = require("./views") // Request-Response Rules

// DEPENDENCIES



const patterns = Object.keys(views);
const rpatterns = patterns.map(view => {
	return RegExp(`^${view}$`);
});


function view(req, _, next) {

	var route = req.path;

	if (patterns.includes(route)) { // Then, find view by key
		var view = views[route];
	} else { // Then, find view by matching route against each pattern
		var index = rpatterns.findIndex(view => view.test(route));
		var view = views[patterns[index]];
	}

	req.view = view;

	req.protected = view[1]?.protected || false; // Marks a route as protected from either of guests or signed-in users
	req.unauthorizedOnly = view[1]?.unauthorizedOnly || false; // Marks a route as protected from signed-in users (e.g /signin, /signup)

	next();
}

module.exports = view;