import React, { useState, useEffect } from 'react';
import { IntegrationAppProvider, useIntegrationApp, IntegrationAppClient } from '@integration-app/react';
import { fetchIntegrationsAndStatuses } from '../utils/utils';
import axios from 'axios';
import * as Tabs from '@radix-ui/react-tabs';
import CompanyForm from './CompanyForm';
import '../App.css';


function CompaniesPage({ customerId }) {
  const integrationApp = useIntegrationApp();
  const [integrations, setIntegrations] = useState([]);
  const [companies, setCompanies] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
    name: '',
    domain: '',
    address: '',
  })


    useEffect(() => {
    const fetchData = async () => {
      const { integrations } = await fetchIntegrationsAndStatuses(integrationApp);
      setIntegrations(integrations);
    };

    fetchData();
  }, [integrationApp]);


  // Fetch companies for the current customer
  useEffect(() => {
    const fetchCompanies = async () => {
      console.log("CustomerId used for companies:", customerId); // Log customerId
      try {
        const response = await axios.get('http://localhost:5000/api/companies', {
          params: { customerId },
        });
        // console.log('Fetched companies', response.data);
        setCompanies(response.data);
      } catch (error) {
        console.log('Error Fetching companies', error);
      }
    };

 // Initial fetch
  fetchCompanies();

  // Polling every 5 seconds to refresh company data
  const interval = setInterval(fetchCompanies, 5000);

  return () => clearInterval(interval); // Cleanup on unmount
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      type: 'created',
      customerId: customerId,
      data: {
        name: formData.name,
        websiteUrl: formData.domain,
        address: formData.address,
      },
    };

    try {
      const response = await axios.post(
        'https://api.integration.app/webhooks/app-events/4dfa937d-989d-4976-883e-ab2af9270273',
        payload
      );

      console.log('Response from integration.app:', response.data);

      if (response.status === 200) {
        alert('Company information sent successfully!');
        setFormData({ name: '', domain: '', address: '' });
        setIsFormOpen(false);
      } else {
        alert('Failed to send company information. Please try again.');
      }
    } catch (error) {
      console.error('Error sending company information:', error);
      alert('An error occurred while sending company information.');
    }
  };



  return (
    <div>
      <h2>Companies</h2>
      <hr />
            <button onClick={fetchCompaniesFromConnectedIntegrations} className="global-button">Fetch companies</button>
    <button className="global-button" onClick={() => setIsFormOpen(true)}>
      Add Company
    </button>
    <hr />
    
    <CompanyForm
      isOpen={isFormOpen}
      onClose={() => setIsFormOpen(false)}
      onSubmit={handleFormSubmit}
      formData={formData}
      setFormData={setFormData}
    />
      <hr />
        <div className="CompaniesTable">
        <div className="CompaniesHeader">
          <span>Company Name</span>
          <span>Domain</span>
          <span>Address</span>
        </div>
        {companies.map((company) => (
          <div key={company.id} className="CompanyRow">
            <span>{company.name}</span>
            <span>{company.domain}</span>
            <span>{company.address}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompaniesPage;