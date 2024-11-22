import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

console.log('WORKSPACE_KEY:', process.env.WORKSPACE_KEY);
console.log('WORKSPACE_SECRET:', process.env.WORKSPACE_SECRET);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const WORKSPACE_KEY = process.env.WORKSPACE_KEY;
const WORKSPACE_SECRET = process.env.WORKSPACE_SECRET;


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
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
