import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

console.log('WORKSPACE_KEY:', process.env.WORKSPACE_KEY);
console.log('WORKSPACE_SECRET:', process.env.WORKSPACE_SECRET);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const WORKSPACE_KEY = process.env.WORKSPACE_KEY;
const WORKSPACE_SECRET = process.env.WORKSPACE_SECRET;

// SQLite databse setup
  const db = new Database('companies.db', { verbose: console.log });
  db.prepare(`
        CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRiMARY KEY AUTOINCREMENT,
        customer_id TEXT,
        name TEXT,
        domain TEXT,
        address TEXT
        )
    `).run();

  // dummy data

  const dummyData = [
    { customer_id: '12345', name: 'Acme Inc.', domain: 'acme.com', address: '123 Acme St' },
    { customer_id: '12345', name: 'Tech Solutions', domain: 'techsolutions.com', address: '456 Tech Ave' },
    { customer_id: '12345', name: 'Widgets Corp.', domain: 'widgets.com', address: '789 Widget Blvd' },
  ];

  // validate data and insert after
  dummyData.forEach(({ customer_id, name, domain, address})=> {
    const exists = db.prepare('SELECT COUNT(*) AS count FROM companies WHERE customer_id = ? AND NAME = ?').get(customer_id, name).count;

    if (exists === 0) {
      db.prepare('INSERT INTO companies (customer_id, name, domain, address) VALUES (?, ?, ?, ?)').run(customer_id, name, domain, address);
    }
  });


// Endpoint to generate token
app.post('/api/generate-token', (req, res) => {
    const { customerId, customerName } = req.body;
  
    // error to provide customer name and ID
    if (!customerId || !customerName) {
      return res.status(400).json({ error: 'Customer ID and name are required.' });
    }
  
    const tokenData = {
      id: customerId,
      name: customerName,
      fields: {
        userField: 'example field value',
      },
    };
  
    const options = {
      issuer: WORKSPACE_KEY,
      expiresIn: 7200, // 2 hours
      algorithm: 'HS512',
    };
  
  // Debugging the token data
  console.log('Token Data:', tokenData);
  console.log('Options:', options);


    try {
      const token = jwt.sign(tokenData, WORKSPACE_SECRET, options);
      res.json({ token });
    } catch (error) {
      console.error('JWT Generation Error:', error.message); // Log the exact error
      res.status(500).json({ error: 'Failed to generate token.' });
    }
  });


  // Fetch companies for quiven customer ID
  app.get('/api/companies', (req, res) => {
    const { customerId } = req.query;

    const companies = db.prepare('SELECT * FROM companies WHERE customer_id = ?').all(customerId);
    res.json(companies);
  }
  );

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} or the one specific for the github conding space you are on:`);
  });
