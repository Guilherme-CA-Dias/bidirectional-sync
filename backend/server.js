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
      db.prepare('INSERT INTO companies (customer_id, "name", domain, address) VALUES (?, ?, ?, ?)').run(customer_id, name, domain, address);
    }
  });

// Add companies fetched from CRM
app.post('/api/add-companies', (req, res) => {
  const { customerId, companies } = req.body;

  if (!customerId || !Array.isArray(companies)) {
    return res.status(400).json({ error: 'Invalid input: customerId and companies array are required.'});
  }

  try {
    const insertStmt = db.prepare('INSERT INTO companies (customer_id, "name", domain, address) VALUES (?, ?, ?, ?)');

    companies.forEach(({ name, domain, address }) => {
      const exists = db.prepare('SELECT COUNT(*) AS count FROM companies WHERE customer_id = ? AND name = ?').get(customerId, name).count;

      if (exists === 0) {
        insertStmt.run(customerId, name, domain || 'N/A', address || 'N/A');
      }
    });


    console.log('Companies added successfully for customer:', customerId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding companies', error.message);
    res.status(500).json({ error: 'Failed to add companies to the database' });
  };
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

    if (companies.length === 0) {
    // Preload dummy data for the new customerId
    const dummyData = [
      { customer_id: customerId, name: 'Acme Inc.', domain: 'acme.com', address: '123 Acme St' },
      { customer_id: customerId, name: 'Tech Solutions', domain: 'techsolutions.com', address: '456 Tech Ave' },
      { customer_id: customerId, name: 'Widgets Corp.', domain: 'widgets.com', address: '789 Widget Blvd' },
    ];

    const insertStmt = db.prepare(
      'INSERT INTO companies (customer_id, name, domain, address) VALUES (?, ?, ?, ?)'
    );

    dummyData.forEach(({ customer_id, name, domain, address }) => {
      insertStmt.run(customer_id, name, domain, address);
    });

    // Fetch the newly inserted dummy data
    const updatedCompanies = db.prepare('SELECT * FROM companies WHERE customer_id = ?').all(customerId);
    return res.json(updatedCompanies);
  }

    res.json(companies);
  }
  );

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} or the one specific for the github conding space you are on:`);
  });

// Clean table to its original state
app.get('/api/reset-companies', (req, res) => {
  const { clearTable } = req.query;

  if (clearTable) {
    try {
      // Clear all rows from the companies table
      db.prepare('DELETE FROM companies').run();

      // Optionally, reinsert the original dummy data
      const dummyData = [
        { customer_id: '12345', name: 'Acme Inc.', domain: 'acme.com', address: '123 Acme St' },
        { customer_id: '12345', name: 'Tech Solutions', domain: 'techsolutions.com', address: '456 Tech Ave' },
        { customer_id: '12345', name: 'Widgets Corp.', domain: 'widgets.com', address: '789 Widget Blvd' },
      ];

      const insertStmt = db.prepare('INSERT INTO companies (customer_id, name, domain, address) VALUES (?, ?, ?, ?)');
      dummyData.forEach(({ customer_id, name, domain, address }) => {
        insertStmt.run(customer_id, name, domain, address);
      });

      res.json({ success: true, message: 'Companies table has been reset to its original state.' });
    } catch (error) {
      console.error('Error resetting companies table:', error.message);
      res.status(500).json({ error: 'Failed to reset companies table.' });
    }
  } else {
    res.status(400).json({ error: 'Invalid query parameter. Use ?clearTable=true to reset the table.' });
  }
});

// Endpoint to handle CRM updates from integration.app
app.post('/api/webhook/updates', (req, res) => {
  const { customerId, updates } = req.body;
  const mode = req.query.mode; // Accept query parameter 'mode'

  if (!customerId || !Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid input: customerId and updates array are required.' });
  }

  if (!['create', 'update', 'delete'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Use ?mode=create, ?mode=update, or ?mode=delete.' });
  }

  try {
    if (mode === 'create') {
      const insertStmt = db.prepare('INSERT INTO companies (customer_id, "name", domain, address) VALUES (?, ?, ?, ?)');

      updates.forEach(({ name, domain, address }) => {
        const exists = db.prepare('SELECT COUNT(*) AS count FROM companies WHERE customer_id = ? AND name = ?').get(customerId, name).count;

        if (exists === 0) {
          insertStmt.run(customerId, name, domain || 'N/A', address || 'N/A');
        }
      });

      console.log(`Created records for customer: ${customerId}`);
    } else if (mode === 'update') {
      const updateStmt = db.prepare(
        `UPDATE companies 
        SET domain = ?, address = ? 
        WHERE customer_id = ? AND "name" = ?`
      );

      updates.forEach(({ name, domain, address }) => {
        const exists = db.prepare('SELECT COUNT(*) AS count FROM companies WHERE customer_id = ? AND name = ?').get(customerId, name).count;

        if (exists > 0) {
          updateStmt.run(domain || 'N/A', address || 'N/A', customerId, name);
        }
      });

      console.log(`Updated records for customer: ${customerId}`);
    } else if (mode === 'delete') {
      const deleteStmt = db.prepare(
        'DELETE FROM companies WHERE customer_id = ? AND "name" = ?'
      );

      updates.forEach(({ name }) => {
        deleteStmt.run(customerId, name);
      });

      console.log(`Deleted records for customer: ${customerId}`);
    }

    res.json({ success: true, message: `Processed ${mode} operation for customer: ${customerId}` });
  } catch (error) {
    console.error(`Error processing ${mode} operation for updates:`, error.message);
    res.status(500).json({ error: `Failed to process ${mode} operation for updates.` });
  }
});