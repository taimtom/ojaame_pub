# Google Integration Usage Implementation

## Overview

I have successfully implemented a comprehensive Google integration usage dashboard for your Point-of-Sales system. The new system properly fetches and displays usage data for both Google Drive and Email integrations from your backend.

## What Was Implemented

### 1. Backend API Integration

**Added new functions to `/src/actions/integration.js`:**
- `useGetEmailLogs(storeId, options)` - Fetch email logs from backend
- `useGetDriveFiles(storeId, options)` - Fetch drive files from backend  
- `getIntegrationUsageStats(integrationId, storeId)` - Calculate comprehensive usage statistics

These functions properly connect to your backend endpoints:
- `/api/integrations/email-logs` - Get email logs
- `/api/integrations/drive-files` - Get drive files

### 2. Comprehensive Usage Dashboard

**Created `/src/sections/integration/view/google-integration-usage-view.jsx`:**

#### Features:
- **Usage Overview Cards**: Visual statistics for email and drive usage
- **Email Usage Stats**: 
  - Total emails sent
  - Success/failure rates
  - Meeting invites sent
  - Activity over last 7/30 days
- **Drive Usage Stats**:
  - Total files uploaded
  - Active files count
  - Total storage used
  - File type breakdown
  - Activity over last 7/30 days

#### Tabbed Interface:
- **Email Logs Tab**: Complete table showing:
  - Recipient email addresses
  - Email subjects
  - Send status (sent/failed/pending)
  - Email type (regular email vs meeting invite)
  - Timestamps
  - Action buttons

- **Drive Files Tab**: Complete table showing:
  - File names (original and Google Drive names)
  - File types and icons
  - File sizes
  - Upload timestamps
  - Status (active/inactive)
  - Links to view files in Google Drive

### 3. Navigation Integration

**Updated routing:**
- Added route: `/dashboard/integration/:id/usage`
- Added page: `/src/pages/dashboard/integration/google-usage.jsx`
- Added "View Usage" button to integration details view

### 4. Real-time Data Loading

The dashboard automatically:
- Loads integration details from backend
- Fetches email logs based on store ID
- Fetches drive files based on store ID  
- Calculates usage statistics in real-time
- Shows loading states and error handling
- Refreshes data when needed

## Backend API Endpoints Used

Based on your backend structure, the frontend now connects to:

```
GET /api/integrations/email-logs?store_id={storeId}&limit={limit}&offset={offset}
GET /api/integrations/drive-files?store_id={storeId}&limit={limit}&offset={offset}
GET /api/integrations/{integrationId}
```

## How to Access Usage Data

### Method 1: From Integration Details
1. Go to **Dashboard** → **Integrations** → **List**
2. Click on any Google integration
3. Click the **"View Usage"** button

### Method 2: Direct URL
- Navigate to: `/dashboard/integration/{integration_id}/usage`

## Data Display Features

### Email Usage Section
- **Visual Progress Bars**: Show email usage relative to limits
- **Color-coded Metrics**: Green for success, red for failures
- **Time-based Filtering**: Last 7 days, 30 days statistics
- **Meeting Invite Tracking**: Special indicators for calendar invites

### Drive Usage Section  
- **Storage Usage**: Shows total storage used with visual indicators
- **File Type Breakdown**: Chips showing distribution of file types
- **Active File Tracking**: Distinguishes between active and inactive files
- **Direct Google Drive Links**: Buttons to view files in Google Drive

### Interactive Features
- **Search and Filter**: Tables support browsing through large datasets
- **Tooltips**: Hover information for truncated text
- **Status Indicators**: Clear labels for file/email status
- **Responsive Design**: Works on desktop and mobile devices

## Error Handling

The implementation includes robust error handling:
- **Loading States**: Spinners while data is being fetched
- **Error Messages**: Clear feedback when API calls fail
- **Empty States**: Helpful messages when no data is available
- **Fallback Content**: Graceful handling of missing integrations

## Integration with Existing System

### Maintains Compatibility
- Uses existing axios configuration
- Follows existing UI patterns and components
- Integrates with current authentication system
- Uses established routing patterns

### Leverages Backend Data
- Reads from existing `EmailLog` and `GoogleDriveFile` models
- Uses store-based filtering that matches your database structure
- Respects existing pagination and limiting parameters

## Statistics Calculated

The system provides these key metrics:

### Email Analytics
- Total emails sent across all time
- Success rate (sent vs failed)
- Meeting invites with ICS attachments
- Recent activity trends

### Drive Analytics  
- Total file count and storage usage
- File type distribution
- Upload activity trends
- Active vs inactive file tracking

## Performance Optimization

- **SWR for Caching**: Efficient data fetching with automatic revalidation
- **Pagination Support**: Handles large datasets without performance issues
- **Selective Loading**: Only loads data when needed
- **Memoized Components**: Optimized re-rendering

## Next Steps

1. **Test the Implementation**: Navigate to a Google integration and click "View Usage"
2. **Verify Data Flow**: Ensure email logs and drive files appear correctly
3. **Check Backend Connectivity**: Confirm API endpoints are responding
4. **Monitor Performance**: Watch for any loading or error issues

The system is now ready to display comprehensive Google integration usage data from your backend API!

