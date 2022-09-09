const requiredCredential = ["NODE_ENV", "DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "PASSWDS_TABLE", "COOKIES_KEY", "SESSIONS_KEY"];

for (credential of requiredCredential) {
	if (!process.env[credential]) {
		console.log(`Missing required credential in env: ${credential}`);
		console.log("Exiting...");
		process.exit(1);
	}
}