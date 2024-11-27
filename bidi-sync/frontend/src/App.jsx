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
    }, []);

        // Render a loading spinner or placeholder while the token is being fetched
        if (!token) {
        return <div>Loading...</div>;
  }


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
        const response = await axios.get('http://localhost:5000/api/companies', {
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

// Function to fetch companies from CRMs
const fetchCompaniesFromConnectedIntegrations = async () => {
  try {
      const connectedIntegrations = integrations.filter(
          (integration) => integration.connection?.disconnected === false
      );

      console.log("Connected Integrations", connectedIntegrations);

      for (const integration of connectedIntegrations) {
        try {
          console.log(`Fetching integrations for integration: ${integration.name}`);

          // Fetch companies from the current integration
          const response = await integrationApp.connection(integration.key).action('get-companies').run({});
          
          console.log(`companies for ${integration.name}:`, response.output.records);

          const companies = response.output.records.map((company) => ({
            name: company.fields.name || 'N/A',
            domain: company.fields.domain || 'N/A',
            address: company.fields.primaryAddress?.full || 'N/A',
          })
        );

        console.log(`processed companies for ${integration.name}:`, companies);

        await axios.post('https://ominous-space-tribble-x44jrxrw95jcprjj-5000.app.github.dev/api/add-companies', {
            customerId,
            companies,
        });

        console.log(`Successfully stored companies for integration: ${integration.name}`);
          } catch (innerError) {
          console.error(`Error fetching companies for ${integration.name}:`, innerError.message);
        }

      };

      // const response1 = await integrationApp.connection('hubspot').action('get-companies').run({});
      // console.log('HubSpot Response:', response1);
      //   const data = response1.output.records;
      //     console.log('Companies:', data);

      //     // Send companies to server.js for storage
      //     await axios.post('http://localhost:5000/api/add-companies', {
      //       customerId,
      //       companies: data.map((company) => ({
      //         name: company.fields.name || 'N/A',
      //     domain: company.fields.websiteUrl || 'N/A',
      //     address: company.fields.primaryAddress?.full || 'N/A',
      //       })),
      //     });

          // Refresh the companies List
          const response = await axios.get('https://ominous-space-tribble-x44jrxrw95jcprjj-5000.app.github.dev/api/companies', {
            params: { customerId },
          });
          setCompanies(response.data);

          alert('Integration companies have been added succesfully');

      } catch (error) {
            console.error('error fetching companies', error);
            alert('failed to fetch companies from Action');
        };
};

  // Function to open the configuration modal for a specific integration
  const handleConfigure = (integrationKey) => {
    try {
      integrationApp.integration(integrationKey).open();
    } catch (error) {
      console.log(`Error openning configuration for ${integrationKey}`, error);
    }
  };


  return (
    <div>
      <button onClick={() => integrationApp.open()}>Select and connect to integrations using our UI</button>
      <hr></hr>
      <h2>Avaiable integrations</h2>
      <ul>
        {integrations.map((integration) => (
          <li key={integration.id} style={{ marginBottom: "10px" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {/* Configure button for every integration */}
                <button onClick={() => handleConfigure(integration.key)}>
                  Configure {integration.name}
                  </button>
              </div>
          </li>
        ))}
      </ul>
      <hr></hr>
      <button onClick={fetchCompaniesFromConnectedIntegrations}>Fetch companies</button>

      <hr></hr>
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