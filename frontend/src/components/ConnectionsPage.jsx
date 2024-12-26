import React, { useState, useEffect } from 'react';
import { useIntegrationApp } from '@integration-app/react';
import { fetchIntegrationsAndStatuses } from '../utils/utils';
import axios from 'axios';
import '../App.css';
import * as Switch from '@radix-ui/react-switch';


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
      if (isChecked) {
        // Create the flow if enabling
        try {
          await integrationApp
            .connection(integrationKey)
            .flow('receive-company-events')
            .create();
          
          console.log(`Flow created for ${integrationKey}`);
        } catch (error) {
          // If error is because flow already exists, continue
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }

      // Update the flow status
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
      
      // Revert the toggle state in case of error
      setFlowStatuses((prev) => ({
        ...prev,
        [integrationKey]: !isChecked,
      }));
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
    <div className="page-container">
      <div>
        <button
          onClick={() => integrationApp.open()}
          className="global-button"
        >
          Select and connect to integrations using our UI
        </button>
        <hr />
        <h2>Available Integrations</h2>
        <ul className="IntegrationList">
          <li className="IntegrationHeader">
            <span className="IntegrationColumn">Integration</span>
            <span className="StatusColumn">Status</span>
            <span className="SyncColumn">Sync Enabled</span>
          </li>

          {integrations.map((integration) => (
            <li key={integration.id} className="IntegrationRow">
              <span className="IntegrationColumn">
                <img
                  src={integration.logoUri}
                  alt={integration.name}
                  className="IntegrationLogo"
                />
                {integration.name}
              </span>
              <span className="StatusColumn">
                <button
                  onClick={() => integrationApp.integration(integration.key).open()}
                  className={`configure-button ${
                    connectionStatuses[integration.key] ? 'active' : 'disabled'
                  }`}
                  title={
                    connectionStatuses[integration.key]
                      ? `Configure ${integration.name}`
                      : `Connect to ${integration.name}`
                  }
                >
                  {connectionStatuses[integration.key]
                    ? `Configure ${integration.name}`
                    : `Connect ${integration.name}`}
                </button>
              </span>
              <span className="SyncColumn">
                <Switch.Root
                  className="switch-root"
                  checked={flowStatuses[integration.key] || false}
                  onCheckedChange={(isChecked) =>
                    handleToggleFlow(integration.key, isChecked)
                  }
                >
                  <Switch.Thumb className="switch-thumb" />
                </Switch.Root>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ConnectionsPage;