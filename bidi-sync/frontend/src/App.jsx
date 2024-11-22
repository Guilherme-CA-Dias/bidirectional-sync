import React, { useState, useEffect } from 'react';
import { IntegrationAppProvider, useIntegrationApp } from '@integration-app/react';
import axios from 'axios';
import './App.css';

function App() {
    const customerId = '12345'; // Fixed customer ID
    const customerName = 'John Doe'; // Fixed customer Name
    const [token, setToken] = useState('');

    useEffect(() => {
      const fetchToken = async () => {
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
   

    fetchToken();
    }, []);


    return (
      //   <div className="App">
      //     <div>
      //       <button onClick={generateToken}>Generate Token</button>
      //     </div>
      //     {token && (
      //       <div>
      //         <h3>Generated Token:</h3>
      //         <textarea readOnly value={token} rows="5" cols="60"></textarea>
      //       </div>
      //     )}
      //   </div>
      // );

      <IntegrationAppProvider token={token}>
      <MyComponent customerId={customerId} />
    </IntegrationAppProvider>
  );
}

function MyComponent({ customerId }) {
  const integrationApp = useIntegrationApp();
  const [integrations, setIntegrations] = useState([]);
  const [companies, setCompanies] = useState([])

  // Fetch available integrations
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const { items: integrations } = await integrationApp.integrations.find();
        console.log("Fetched Integrations Payload", integrations); // Log payload for debugging
        setIntegrations(integrations);
      } catch (error) {
        console.error("Error fetching integrations:", error);
      }
    };

    fetchIntegrations();
  }, [integrationApp]);

  // Fetch companies for the current customer
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('https://scaling-space-meme-gppgx6xqq4j2w756-5000.app.github.dev/api/companies', {
          params: { customerId },
        });
        console.log('Fetched companies', response.data);
        setCompanies(response.data);
      } catch (error) {
        console.log('Error Fetching companies', error);
      }
    };

    fetchCompanies();
  }, [customerId]);


  return (
    <div>
      <button onClick={() => integrationApp.open()}>Integrate</button>
      <h2>Avaiable integrations</h2>
      <ul>
        {integrations.map((integration) => (
          <li key={integration.id} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={integration.logoUri}
                alt={integration.name}
                style={{ width: "30px", height: "30px", marginRight: "10px" }}
              />
              <span>
                {integration.name} -{" "}
                {integration.connection?.disconnected === false ? (
                       <span style={{ color: "green" }}>Connected</span>
                       ) : (
                       <span style={{ color: "red" }}>Not Connected</span>
                       )}
              </span>
            </div>
          </li>
        ))}
      </ul>

      
      <h2>Companies</h2>
      <ul>
        {companies.map((company) => (
          <li key={company.id}>
              <strong>{company.name}</strong> - {company.domain} - {company.address}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;