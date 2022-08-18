const requiredCredential = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME"];

for (credential of requiredCredential) {
	if (!process.env[credential]) {
		console.log(`Missing required credential in env: ${credential}`);
		console.log("Exiting...");
		process.exit(1);
	}
}