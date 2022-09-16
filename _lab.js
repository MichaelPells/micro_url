async function lab () {
	const user = require("./models/UserModel");
	const bcrypt = require("bcrypt");
	const salt = await bcrypt.genSalt(10);

	// console.log(await user.findOne({email: "mpm@gmail.com"}));

	// const valid = user.test(JSON.stringify(
	// 	[{title: "Name", authors: "xx", readYear: 2000}]

	// ), "areBooks");
	// console.log(valid);

	// var time = new Date();
	// var currentTime = `${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
	// console.log(time.toISOString())

	const data = {
		firstName: "Michael",
		lastName: "Pells",
		gender: "Male",
		DOB: [10, 10, 1999],
		nationality: "Nigeria",
		country: "USA",
		// password: await bcrypt.hash("password", salt),
		email: "michael@gmail.com"
	};

	const datas = {
		firstName: "Michael",
		lastName: "Akinpelumi",
		gender: "Male",
		DOB: [10, 10, 1999],
		nationality: "Nigeria",
		country: "USA",
		password: await bcrypt.hash("password", salt),
		email: "Michaelp1@gmail.com",
		emailAddresses: ["MichaelK@gmail.com", "Michaelk@gmail.com"],
		city: "NY",
		skills: ["Writing", "riting"],
		about: "This is an about",
		careerQuestionnaires: [{question: "Question?", answer: "Answer!"}, {question: "Question?", answer: "Answer!"}],
		CARs: [{name: "zzzname", issuer: "zzzname", id: "zzzline", title: "zzzname", date: [10,10,1999]}]
	};

	var User = new user(datas);
	User.on("validated", async () => {
		console.log("Validated!")
		console.log(User);
		// User.firstName = "Michelle";
		// User.city = "Florida";
		// User.skills = ["Writing", "Coding"];
		// User.password = await bcrypt.hash("michaele", salt);
		User.save()
		.then(async () => {
			console.log("User Saved!");
			console.log(await user.findOne({email: datas.email}));
		})
		.catch((err) => {
			console.log(err.message);
		});
		
		console.log(User.get(["firstName", "lastName"]));
	});
	User.on("rejected", (err) => {
		console.log(err.message);
	});

	// User = new user(data);
	// User.on("validated", () => {
	// 	// User.data.firstName = undefined;
	// 	// User.validate(false, (err) => {
	// 	// 	if (err) {console.log(err)}
	// 	// 	else {console.log(User)}
	// 	// });

	// 	User.update({firstName: "Mike"}, (err) => {
	// 		if (!err) {
	// 			// console.log(err.message);
	// 			User.city = "New York";
	// 			User.phone = 234;

	// 			User.validate((err) => {
	// 				if (err) {
	// 					console.log(err);
	// 					return;
	// 				}
	// 				console.log(User);
	// 				User.discardAll((err) => {
	// 					console.log("Undoing...")
	// 					if (err) {
	// 						console.log(err.message)
	// 					} else {
	// 						console.log(User)
	// 					}
	// 				});
	// 			});
	// 		} else {
	// 			console.log(err);
	// 		}
	// 	});
	// });
	// User.on("rejected", (err) => {
	// 	console.log("rejected", err);
	// })

	// (async () => {
	// 	User = await user.findOne({id: 2});
	// 	console.log(User);
	// 	User = new user({email: (await user.findOne({id: 2})).email});
	// 	User.on("validated", () => {
	// 		console.log(User);
	// 	});
	// 	User.on("rejected", (err) => {
	// 		console.log(err);
	// 	});
	// })();

	// var text = "<He&llo>";
	// console.log(String.fromCharCode("t"))

	// User = await user.getOne(["entry", "id", "firstName", "DOB ->> '$[2]'"], {"id": "4952583171"});
	// // , {"order by": "accounts.entry"}
	// console.log(User)

	// (async () => {
	// 	try {
	// 		User = await user.findMany({"<logic>": "<1> AND <2>", "firstName": "Michael", "DOB ->> '$[0]'": [">=", "10"]}, {"order by": "accounts.entry", "limit": 2, "offset": 5})
	// 		console.log(User)
	// 	} catch (err) {
	// 		console.log(err)
	// 	}
	// })();

	// var dataset = [];

	// for (i = 0; i < 2; i++) {
	// 	dataset.push({...data, email: data.email.replace("@", `${i+1}@`)});
	// }

	// user.createMany(dataset, (err, fails) => {
	// 	console.log("--------------- Errors ---------------");
	// 	console.log(err);
	// 	console.log("--------------- Fails ---------------");
	// 	console.log(fails);
	// });
}
lab();