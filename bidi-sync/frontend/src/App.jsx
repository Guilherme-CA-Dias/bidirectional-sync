import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const customerId = '12345'; // Fixed customer ID
    const customerName = 'John Doe'; // Fixed customer Name
    const [token, setToken] = useState('');

    const generateToken = async () => {
        try {
            const response = await axios.post('https://scaling-space-meme-gppgx6xqq4j2w756-5000.app.github.dev/api/generate-token', {
                customerId,
                customerName,
            });
            setToken(response.data.token);
        } catch (error){
            console.error(error);
            alert('Failed to generate token.', error);
        }
    };
    return (
        <div className="App">
          <div>
            <button onClick={generateToken}>Generate Token</button>
          </div>
          {token && (
            <div>
              <h3>Generated Token:</h3>
              <textarea readOnly value={token} rows="5" cols="60"></textarea>
            </div>
          )}
        </div>
      );
}

export default App;