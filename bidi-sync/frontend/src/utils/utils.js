export const fetchIntegrationsAndStatuses = async (integrationApp) => {
  try {
    // Fetch integrations
    const { items: integrations } = await integrationApp.integrations.find();

    // Initialize connection statuses
    const connectionStatuses = {};
    integrations.forEach((integration) => {
      connectionStatuses[integration.key] = integration.connection?.disconnected === false;
    });

    // Fetch flow statuses for connected integrations
    const connectedIntegrations = integrations.filter(
      (integration) => integration.connection?.disconnected === false
    );

    const flowStatuses = {};
    for (const integration of connectedIntegrations) {
      const response = await integrationApp.connection(integration.key).flows.list();
      const flow = response.items.find((f) => f.name === 'Receive Company Events');
      flowStatuses[integration.key] = flow?.enabled || false;
    }

    return { integrations, connectionStatuses, flowStatuses };
  } catch (error) {
    console.error('Error fetching integrations and statuses:', error.message);
    return { integrations: [], connectionStatuses: {}, flowStatuses: {} };
  }
};
