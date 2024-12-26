import React from 'react';

function CompanyForm({ isOpen, onClose, onSubmit, formData, setFormData, formType }) {
  if (!isOpen) return null;

  const getFormTitle = () => {
    switch (formType) {
      case 'created':
        return 'Add New Company';
      case 'updated':
        return 'Update Company';
      case 'deleted':
        return 'Delete Company';
      default:
        return 'Company Form';
    }
  };

  const getDescriptionText = () => {
    switch (formType) {
      case 'updated':
        return 'Enter the company name to update. The company with matching name will be updated with the new information.';
      case 'deleted':
        return 'Enter the company name to delete. The company with matching name will be removed.';
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', margin: 0 }}>{getFormTitle()}</h2>
          <button 
            onClick={onClose}
            style={{ 
              border: 'none', 
              background: 'none', 
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Company Name
            </label>
            {formType !== 'created' && (
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {getDescriptionText()}
              </div>
            )}
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter company name"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Domain
            </label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="Enter domain"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="configure-button"
              style={{ width: 'auto' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="global-button"
              style={{ width: 'auto' }}
            >
              {formType === 'created' ? 'Add Company' : 
               formType === 'updated' ? 'Update Company' : 
               'Delete Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyForm;