const query = {
	createUser: `INSERT INTO @ (@) VALUES (@)`,
	creatManyUsers: `INSERT INTO @ (@) VALUES @`,
	findUser: `SELECT @ FROM @ WHERE @@ = ?`,
	findManyUsers: `SELECT @ FROM @ WHERE @(@) @`,
	updateUser: `UPDATE @ SET @ WHERE id = ?`,
	deleteUser: `DELETE FROM @ WHERE id = ?`
}

module.exports = query;