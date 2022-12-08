"use strict";
const query = {
    createLink: `INSERT INTO URLs (owner, short, url) VALUES (?, ?, ?)`,
    findLink: `SELECT * FROM URLs WHERE short = ?`,
    findManyLinks: `SELECT * FROM URLs WHERE owner = ?`,
    updateLink: `UPDATE URLs SET owner = ?, short = ?, url = ? WHERE entry = ?`,
    deleteLink: `DELETE FROM URLs WHERE short = ?`
};
module.exports = query;
