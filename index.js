// SETTINGS
require("dotenv").config();
const host = "localhost";
const port = process.env.PORT || 2222;

// IMPORTS
const ready = require("./comm");
const handle_get = require("./controllers/content-handler");

// DEPENDENCIES
const express = require("express");
const cors = require("cors");



// BOOT PROCESS
const app = express();
require("./init_env");
asyncBootSteps = ["./databases/scripts/connect_db", "./databases/scripts/create_db", "./databases/scripts/setup_tables", "!begin_Listening"]

function begin_step(step) {
	if (step == "!begin_Listening") {
		app.listen(port, host, () => {
			ready.begin_Listening = true;
			console.log(`Server now communicating at http://${host}:${port}`);
		});
	}
}

function do_step(n) {
	var stepId = setInterval(() => {
		if (n) {
			var prevStep = asyncBootSteps[n-1].split("/").reverse()[0];
		} else {
			var prevStep = "init";
		}
		if (ready[prevStep]) {
			if (!asyncBootSteps[n].startsWith("!")) {
				require(asyncBootSteps[n]);
			} else {
				begin_step(asyncBootSteps[n]);
			}
			clearInterval(stepId);
		}
	}, 0)
}

for (var n = 0; n < asyncBootSteps.length; n++) {
	do_step(n);
}



// BACK-END BUSINESS
app.use(cors());

app.get(/^\/.*/, handle_get);