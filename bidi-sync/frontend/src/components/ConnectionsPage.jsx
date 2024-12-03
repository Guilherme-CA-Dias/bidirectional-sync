import React, { useState, useEffect } from 'react';
import { useIntegrationApp } from '@integration-app/react';
import { fetchIntegrationsAndStatuses } from '../utils/utils';
import axios from 'axios';


function ConnectionsPage({ customerId }) {
  const integrationApp = useIntegrationApp();
  const [integrations, setIntegrations] = useState([]);
  const [flowStatuses, setFlowStatuses] = useState({}); // State to track flow statuses
  const [connectionStatuses, setConnectionStatuses] = useState({}); // State for connection statuses

  // Fetch integrations, connection statuses, and flow statuses
  useEffect(() => {
    const fetchData = async () => {
      const { integrations, connectionStatuses, flowStatuses } =
        await fetchIntegrationsAndStatuses(integrationApp);

      setIntegrations(integrations);
      setConnectionStatuses(connectionStatuses);
      setFlowStatuses(flowStatuses);
    };

    fetchData();

    // Periodically refresh connection statuses
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [integrationApp]);


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
        <div>
             <button onClick={() => integrationApp.open()}>Select and connect to integrations using our UI</button>
             <hr />
      <h2>Available Integrations</h2>
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

        {integrations.map((integration) => (
          <li key={integration.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={integration.logoUri}
                  alt={integration.name}
                  style={{ width: '30px', height: '30px', marginRight: '10px' }}
                />
                <span>
                  {integration.name} -{' '}
                  {connectionStatuses[integration.key] ? (
                    <span style={{ color: 'green' }}>Connected</span>
                  ) : (
                    <span style={{ color: 'red' }}>Not Connected</span>
                  )}
                </span>
              </div>
              <button onClick={() => integrationApp.integration(integration.key).open()}>
                Configure {integration.name}
              </button>
              <label style={{ marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={flowStatuses[integration.key] || false}
                  onChange={(e) => handleToggleFlow(integration.key, e.target.checked)}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}

export default ConnectionsPage;