# Integration App - Bi-Directional Sync

This is a React and Node.js application for integrating and syncing company data across multiple CRMs using `integration.app`. The app supports:
- Fetching companies from connected CRMs.
- Adding, updating, and deleting companies.
- Real-time updates through webhooks.

## Features
- **Integration Management**: View connected integrations and manage synchronization flows.
- **Bi-Directional Sync**: Pull company data from CRMs and push updates back.
- **Real-Time Updates**: Receive notifications via webhooks when CRM data changes.

## Installation
Follow these steps to set up and run the application locally.

### Prerequisites
Ensure you have the following installed:
- Node.js (>= 16.x)
- npm (>= 8.x)
- SQLite3

### Clone the Repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY

### Backend Setup
1. Navigate to the backend directory:
   cd backend

2. Install dependencies:
   npm install

3. Create a `.env` file with the following:
   WORKSPACE_KEY=your_workspace_key
   WORKSPACE_SECRET=your_workspace_secret

4. Start the backend server:
   node server.js

### Frontend Setup
1. Navigate to the frontend directory:
   cd ../frontend

2. Install dependencies:
   npm install

3. Start the React application:
   npm start

### Access the App
Once both the backend and frontend are running, open your browser and navigate to:
http://localhost:3000

## Usage
1. Connect integrations via the UI.
2. Fetch companies from connected CRMs.
3. Manage company synchronization flows.
4. Receive updates via webhooks when CRM data changes.

## API Endpoints
The backend provides the following endpoints:
- **Generate Token**: POST /api/generate-token
- **Add Companies**: POST /api/add-companies
- **Fetch Companies**: GET /api/companies
- **Reset Companies**: GET /api/reset-companies
- **Receive Webhook Updates**: POST /api/webhook/updates
