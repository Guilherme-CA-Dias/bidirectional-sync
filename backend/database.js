import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./companies.db");

// Initialize the table and insert dummy data
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT,
      name TEXT,
      domain TEXT,
      address TEXT
    )
  `);

  // Insert dummy data (only the first time)
  db.run(`
    INSERT INTO companies (account_id, name, domain, address)
    VALUES
      ('12345', 'Company A', 'company-a.com', '1234 Elm St'),
      ('12345', 'Company B', 'company-b.com', '5678 Oak St'),
      ('67890', 'Company C', 'company-c.com', '9101 Maple Ave')
  `);
});

export default db;