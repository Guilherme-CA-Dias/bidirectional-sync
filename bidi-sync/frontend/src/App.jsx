import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router , Route, Routes, Link } from 'react-router-dom';
import { IntegrationAppProvider, useIntegrationApp, IntegrationAppClient } from '@integration-app/react';
import axios from 'axios';
import CompaniesPage from './components/CompaniesPage';
import ConnectionsPage from './components/ConnectionsPage';
import Navbar from './components/Navbar'; // Include the Navbar component
import './App.css';

function App() {
    const [customerId, setCustomerId] = useState(() => {
        // Use sessionStorage for per-session uniqueness
        return sessionStorage.getItem('customerId') || Math.random().toString(36).substring(2, 14).padEnd(12, '0');
    });
    const customerName = `Customer-${Math.random().toString(36).substring(7)}`; // Random customer name
    const [token, setToken] = useState('');

    useEffect(() => {
      // Save customerId to localStorage to persist across reloads
      sessionStorage.setItem('customerId', customerId);

      const fetchToken = async () => {
        console.log("CustomerId for token generation:", customerId);
        try {
            const response = await axios.post('http://localhost:5000/api/generate-token', {
                customerId,
                customerName,
            });
            setToken(response.data.token);
        } catch (error){
            console.error(error);
            alert('Failed to generate token.', error);
        }
    };
   

    fetchToken();
    }, [customerId]);

        // Render a loading spinner or placeholder while the token is being fetched
        if (!token) {
        return <div>Loading...</div>;
  }

    return (
    <IntegrationAppProvider token={token}>
      <MainApp customerId={customerId} />
    </IntegrationAppProvider>
  );
}

    
function MainApp({ customerId }) {
  const integrationApp = useIntegrationApp();
  const [integrations, setIntegrations] = useState([]);

  // Fetch integrations
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const { items: integrations } = await integrationApp.integrations.find();
        setIntegrations(integrations);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      }
    };

    fetchIntegrations();
  }, [integrationApp]);

  return (
     <Router>
      <Navbar />
      <div className="AppContent">
        <Routes>
          <Route path="/" element={<ConnectionsPage customerId={customerId} />} />
          <Route path="/companies" element={<CompaniesPage customerId={customerId} integrations={integrations} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;