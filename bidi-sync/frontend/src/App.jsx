import React, { useState, useEffect } from 'react';
import { IntegrationAppProvider, useIntegrationApp, IntegrationAppClient } from '@integration-app/react';
import axios from 'axios';
import './App.css';

function App() {
    const customerId = Math.random().toString(36).substring(2, 14).padEnd(12, '0'); // 12-character alphanumeric ID
    const customerName = `Customer-${Math.random().toString(36).substring(7)}`; // Random customer name
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
      <IntegrationAppProvider token={token}>
      <MyComponent customerId={customerId} />
    </IntegrationAppProvider>
  );
}

function MyComponent({ customerId }) {
  const integrationApp = useIntegrationApp();
  const [integrations, setIntegrations] = useState([]);
  const [flowStatuses, setFlowStatuses] = useState({}); // State to track flow statuses
  const [connectionStatuses, setConnectionStatuses] = useState({}); // State for connection statuses
  const [companies, setCompanies] = useState([]);

  // Fetch integrations, connection statuses, and flow statuses
  useEffect(() => {
    const fetchIntegrationsAndStatuses  = async () => {
      try {
        const { items: integrations } = await integrationApp.integrations.find();
        console.log("Fetched Integrations Payload", integrations); // Log payload for debugging
        setIntegrations(integrations);

        // Initialize connection statuses
        const connections = {};
        integrations.forEach((integration) => {
          connections[integration.key] = integration.connection?.disconnected === false;
        });
        setConnectionStatuses(connections);

        // Fetch flow statuses only for connected integrations
        const connectedIntegrations = integrations.filter(
          (integration) => integration.connection?.disconnected === false
        );

        const statuses = {};
        for (const integration of connectedIntegrations) {
          const response = await integrationApp.connection(integration.key).flows.list();
          const flow = response.items.find((f) => f.name === 'Receive Company Events');
          statuses[integration.key] = flow?.enabled || false;
        }
        setFlowStatuses(statuses);

      } catch (error) {
        console.error("Error fetching integrations:", error);
      }
    };

    fetchIntegrationsAndStatuses ();


    // Periodically refresh connection statuses
    const interval = setInterval(fetchIntegrationsAndStatuses, 5000);
    return () => clearInterval(interval);
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


 // Toggle flow enable/disable
  const handleToggleFlow = async (integrationKey, isChecked) => {
    try {
      await integrationApp
        .connection(integrationKey)
        .flow('receive-company-events')
        .patch({ enabled: isChecked });

      setFlowStatuses((prev) => ({
        ...prev,
        [integrationKey]: isChecked,
      }));

      alert(`Flow ${isChecked ? 'enabled' : 'disabled'} for ${integrationKey}`);
    } catch (error) {
      console.error(`Error toggling flow for ${integrationKey}:`, error.message);
      alert('Failed to update flow status.');
    }
  };



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

        await axios.post('http://localhost:5000/api/add-companies', {
            customerId,
            companies,
        });

        console.log(`Successfully stored companies for integration: ${integration.name}`);
          } catch (innerError) {
          console.error(`Error fetching companies for ${integration.name}:`, innerError.message);
        }

      };

          // Refresh the companies List
          const response = await axios.get('http://localhost:5000/api/companies', {
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
          <li
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              paddingBottom: '10px',
              borderBottom: '1px solid #ccc',
            }}
          >
            <span style={{ width: '40%' }}>Integration</span>
            <span style={{ width: '30%', textAlign: 'center' }}>Status</span>
            <span style={{ width: '30%', textAlign: 'center' }}>Sync Enabled</span>
          </li>

        {/* Render integration rows */}
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
                {connectionStatuses[integration.key]  ? (
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
            <label style={{marginLeft: '10px' }}>
              <input 
              type="checkbox"
              checked={flowStatuses[integration.key] || false} // Dynamically set checked status
              onChange={(e) => handleToggleFlow(integration.key, e.target.checked)}
              />
            </label>


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