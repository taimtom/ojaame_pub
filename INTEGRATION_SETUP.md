# Integration Setup Guide

This document provides step-by-step instructions for setting up Google and Jumia integrations in your Point-of-Sales system. Each company and store can configure their own integrations independently.

## Overview

The POS system supports multi-tenant integrations, meaning:
- Different companies can set up their own integrations
- Each store within a company can have separate integration configurations
- Integrations are isolated and secure for each tenant

## Supported Integrations

### Google Integrations
- **Gmail Integration**: Send emails, invoices, and meeting invites
- **Google Drive Integration**: Upload files, create folders, backup documents

### Jumia Integration
- **E-commerce Integration**: Sync products, update stock, manage prices

## Prerequisites

1. Active POS system account with company and store setup
2. Admin or store manager permissions
3. Access to the respective service provider accounts (Google Cloud Console, Jumia Seller Portal)

## Google Integration Setup

### Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Gmail API (for email integration)
   - Google Drive API (for drive integration)

### Step 2: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the application details:
   - **App name**: `Your Company Name POS Integration`
   - **User support email**: Your support email
   - **Developer contact information**: Your contact email
   - **Authorized domains**: Add your domain (e.g., `yourcompany.com`)

### Step 3: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://your-domain.com/dashboard/integration/list`
   - `http://localhost:3000/dashboard/integration/list` (for development)
5. Download the JSON file or copy the Client ID and Client Secret

### Step 4: Configure Integration in POS

1. Log into your POS system
2. Navigate to Dashboard → Integration → List
3. Click "Google Setup" to view the setup guide
4. Click "New Integration"
5. Fill in the form:
   - **Name**: `Company Gmail` or `Company Drive`
   - **Provider**: Google
   - **Type**: Email or Drive
   - **Configuration**: Use the JSON template and replace placeholders

```json
{
  "client_secrets": {
    "web": {
      "client_id": "YOUR_GOOGLE_CLIENT_ID",
      "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "redirect_uris": ["https://your-domain.com/dashboard/integration/list"]
    }
  },
  "redirect_uri": "https://your-domain.com/dashboard/integration/list",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.file"
  ]
}
```

6. Click "Create"
7. Click "Activate" to start the OAuth flow
8. Grant permissions when prompted

## Jumia Integration Setup

### Step 1: Jumia Seller Portal Access

1. Log into your [Jumia Seller Portal](https://seller.jumia.com.ng/)
2. Navigate to "Settings" or "API Management"
3. Look for "Developer API" or "Third-party Integrations"

### Step 2: Request API Access

1. Contact Jumia support to request API access if not available
2. Provide your business details and use case
3. Wait for approval (this may take several business days)

### Step 3: Generate API Credentials

1. Once approved, generate your API credentials:
   - Client ID
   - Client Secret
   - Note your User ID and Shop ID(s)

### Step 4: Configure Integration in POS

1. Navigate to Dashboard → Integration → List
2. Click "Jumia Setup" to view the setup guide
3. Click "New Integration"
4. Fill in the form:
   - **Name**: `Company Jumia Store`
   - **Provider**: Jumia
   - **Type**: E-commerce
   - **Configuration**: Use the JSON template

```json
{
  "client_id": "YOUR_JUMIA_CLIENT_ID",
  "client_secret": "YOUR_JUMIA_CLIENT_SECRET",
  "base_url": "https://vendor-api-staging.jumia.com",
  "redirect_uri": "https://your-domain.com/dashboard/integration/list"
}
```

5. Click "Create"
6. Click "Activate" to start the OAuth flow

## Using Integrations

### Google Gmail Features
- Send customer invoices via email
- Send meeting invitations with calendar attachments
- Send custom emails with HTML formatting

### Google Drive Features
- Upload invoice PDFs and reports
- Create organized folders for document storage
- Backup important business documents

### Jumia E-commerce Features
- Sync product catalogs
- Update stock levels in real-time
- Manage pricing across multiple products
- Monitor feed status for bulk operations

## Security Considerations

1. **Credential Storage**: All credentials are encrypted and stored securely
2. **Access Control**: Only authorized users can manage integrations
3. **Audit Trail**: All integration activities are logged
4. **Token Management**: OAuth tokens are automatically refreshed

## Troubleshooting

### Google Integration Issues

**Problem**: "OAuth Error: Invalid Client"
- **Solution**: Verify Client ID and Client Secret are correct
- Check that redirect URIs match exactly

**Problem**: "Access Denied"
- **Solution**: Ensure OAuth consent screen is properly configured
- Verify required APIs are enabled

### Jumia Integration Issues

**Problem**: "API Access Denied"
- **Solution**: Confirm API access has been approved by Jumia
- Check that credentials are for the correct environment (staging vs production)

**Problem**: "Shop Not Found"
- **Solution**: Verify Shop ID is correct
- Ensure the shop is active in Jumia seller portal

## Environment Configuration

For development, create a `.env.local` file with:

```env
VITE_SERVER_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_JUMIA_ENDPOINT=https://vendor-api-staging.jumia.com
```

## Support

For additional support:
1. Check the in-app setup guides
2. Review error logs in the integration details page
3. Contact your system administrator
4. Reach out to the respective service providers for API-specific issues

## Best Practices

1. **Test First**: Use staging/development environments before production
2. **Monitor Usage**: Keep track of API quotas and limits
3. **Regular Updates**: Periodically review and update integration configurations
4. **Backup Credentials**: Securely store backup copies of important credentials
5. **User Training**: Ensure staff understands how to use integration features

---

*Last updated: June 2025*

