import axios from 'axios';
import React, { useState } from 'react';

export default function IntegrationSetup() {
  const [googleConfig, setGoogleConfig] = useState({
    clientId: '',
    clientSecret: '',
    oauthUri: 'https://accounts.google.com/o/oauth2/auth',
    tokenUri: 'https://oauth2.googleapis.com/token',
    redirectUri: 'https://your-domain.com/dashboard/integration/list',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  const [jumiaConfig, setJumiaConfig] = useState({
    clientId: '',
    clientSecret: '',
    baseUrl: 'https://vendor-api-staging.jumia.com',
    redirectUri: 'https://your-domain.com/dashboard/integration/list',
  });

  const handleGoogleConfigChange = (e) => {
    const { name, value } = e.target;
    setGoogleConfig({ ...googleConfig, [name]: value });
  };

  const handleJumiaConfigChange = (e) => {
    const { name, value } = e.target;
    setJumiaConfig({ ...jumiaConfig, [name]: value });
  };

  const submitGoogleIntegration = async () => {
    try {
      const response = await axios.post('/api/integration/create', {
        name: 'Google Integration',
        provider: 'google',
        integration_type: 'email_drive',
        config: googleConfig,
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error creating google integration:', error);
    }
  };

  const submitJumiaIntegration = async () => {
    try {
      const response = await axios.post('/api/integration/create', {
        name: 'Jumia Integration',
        provider: 'jumia',
        integration_type: 'ecommerce',
        config: jumiaConfig,
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error creating jumia integration:', error);
    }
  };

  return (
    <div>
      <h2>Google Integration Setup</h2>
      <input
        type="text"
        name="clientId"
        value={googleConfig.clientId}
        onChange={handleGoogleConfigChange}
        placeholder="Google Client ID"
      />
      <input
        type="text"
        name="clientSecret"
        value={googleConfig.clientSecret}
        onChange={handleGoogleConfigChange}
        placeholder="Google Client Secret"
      />
      <button type="button" onClick={submitGoogleIntegration}>
        Connect Google
      </button>

      <h2>Jumia Integration Setup</h2>
      <input
        type="text"
        name="clientId"
        value={jumiaConfig.clientId}
        onChange={handleJumiaConfigChange}
        placeholder="Jumia Client ID"
      />
      <input
        type="text"
        name="clientSecret"
        value={jumiaConfig.clientSecret}
        onChange={handleJumiaConfigChange}
        placeholder="Jumia Client Secret"
      />
      <button type="button" onClick={submitJumiaIntegration}>
        Connect Jumia
      </button>
    </div>
  );
}
