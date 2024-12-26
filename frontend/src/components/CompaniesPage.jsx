import React, { useState, useEffect } from 'react';
import { IntegrationAppProvider, useIntegrationApp, IntegrationAppClient } from '@integration-app/react';
import { fetchIntegrationsAndStatuses } from '../utils/utils';
import axios from 'axios';
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formType, setFormType] = useState('create'); // 'create', 'update', or 'delete'


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
  setIsLoading(true); // Set loading to true when starting
  try {
    const connectedIntegrations = integrations.filter(
      (integration) => integration.connection?.disconnected === false
    );

    console.log("Connected Integrations", connectedIntegrations);

    for (const integration of connectedIntegrations) {
      let cursor = null;

      do {
        try {
          console.log(`Fetching integrations for integration: ${integration.name} ${cursor ? `(cursor: ${cursor})` : ""}`);

          // Fetch companies from the current integration
          const response = await integrationApp.connection(integration.key).action('get-companies').run(cursor ? { cursor } : {});  // Pass cursor if available
          
          cursor = response.output?.cursor || null; // Update cursor

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
          console.error(`Error fetching companies for ${integration.name}:`, 
            innerError.message
          );
          cursor = null; // Stop pagination on error
        }

      }  while (cursor);}

          // Refresh the companies List
          const response = await axios.get('http://localhost:5000/api/companies', {
            params: { customerId },
          });
          setCompanies(response.data);

          alert('Integration companies have been added successfully');

      } catch (error) {
            console.error('error fetching companies', error);
            alert('failed to fetch companies from Action');
        } finally {
            setIsLoading(false); // Set loading to false when done
        }
};

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      type: formType, // Use the formType instead of hardcoded 'created'
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
        alert(`Company ${formType}d successfully!`);
        setFormData({ name: '', domain: '', address: '' });
        setIsFormOpen(false);
      } else {
        alert(`Failed to ${formType} company information. Please try again.`);
      }
    } catch (error) {
      console.error('Error sending company information:', error);
      alert(`An error occurred while ${formType}ing company information.`);
    }
  };

  const handleOpenForm = (type) => {
    setFormType(type);
    setIsFormOpen(true);
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div>
        <h2>Companies</h2>
        <hr />
        <div className="button-container">
          <button 
            onClick={fetchCompaniesFromConnectedIntegrations} 
            className="global-button"
            disabled={isLoading}
          >
            {isLoading ? 'Fetching...' : 'Fetch companies'}
          </button>
          {!isFormOpen ? (
            <div className="crud-buttons">
              <button 
                className="global-button"
                onClick={() => handleOpenForm('create')}
              >
                Add Company
              </button>
              <button 
                className="global-button"
                onClick={() => handleOpenForm('update')}
              >
                Update Company
              </button>
              <button 
                className="global-button"
                onClick={() => handleOpenForm('delete')}
              >
                Delete Company
              </button>
            </div>
          ) : (
            <button 
              className="global-button"
              onClick={() => setIsFormOpen(false)}
            >
              Close Form
            </button>
          )}
          {isLoading && (
            <div className="loading-text">
              Loading<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
            </div>
          )}
        </div>
        <hr />
      
      <CompanyForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        formType={formType}
      />
        <hr />
        <div className="table-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="CompaniesTable">
          <div className="CompaniesHeader">
            <span>Company Name</span>
            <span>Domain</span>
            <span>Address</span>
          </div>
          {filteredCompanies.map((company) => (
            <div key={company.id} className="CompanyRow">
              <span>{company.name}</span>
              <span>{company.domain}</span>
              <span>{company.address}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompaniesPage;