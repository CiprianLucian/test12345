# Azure App Service Deployment Guide

This guide explains how to deploy the Employee Portal application to Azure App Service with all the necessary fixes for production deployment.

## Fixes Applied

### 1. Backend Fixes

#### Environment Variable Configuration
- **Fixed CORS configuration** to use environment variables instead of hardcoded URLs
- **Added support for multiple origins** including Azure hostnames and localhost for development
- **Improved database path handling** for Azure App Service persistent storage
- **Enhanced logging** with environment information

#### Database Configuration
- **SQLite database path** now uses Azure's persistent storage (`$HOME/data/`)
- **JSON database path** also uses persistent storage to prevent data loss
- **Proper error handling** for database initialization

#### Web.config Updates
- **Modern IISNode configuration** with proper settings for Azure App Service
- **Static file handling** for serving frontend assets
- **API route handling** with proper URL rewriting
- **SPA fallback** for React Router support
- **Security settings** and request filtering

### 2. Frontend Fixes

#### API Configuration
- **Environment variable support** for API URLs using `VITE_API_URL`
- **Consistent API URL usage** across all components
- **Proper build-time environment variable injection**

#### Azure Deployment Configuration
- **Added serve package** as production dependency for static file serving
- **Web.config for SPA routing** to handle client-side routing in Azure
- **Proper build output configuration** with package.json copying

### 3. CI/CD Pipeline Fixes

#### GitHub Actions Workflow
- **Updated to latest action versions** (v4 for checkout and setup-node)
- **Proper environment variable handling** for both frontend and backend
- **Improved error handling** with deployment verification
- **Correct startup commands** for both applications
- **Proper CORS configuration** via Azure CLI

## Prerequisites

1. **Azure Account** with active subscription
2. **GitHub repository** with the code
3. **Azure Service Principal** configured for OIDC authentication
4. **GitHub Secrets** configured:
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`

## Deployment Steps

### 1. Configure GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

```
AZURE_CLIENT_ID: <your-service-principal-client-id>
AZURE_TENANT_ID: <your-azure-tenant-id>
AZURE_SUBSCRIPTION_ID: <your-azure-subscription-id>
```

### 2. Automatic Deployment

The deployment is fully automated via GitHub Actions. Simply:

1. Push changes to the `main` branch
2. The workflow will automatically:
   - Create Azure resources (if they don't exist)
   - Build the frontend with proper environment variables
   - Deploy both frontend and backend
   - Verify the deployment

### 3. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Login to Azure
az login

# Create resource group
az group create --name aim-possible-rg --location westeurope

# Create App Service Plan
az appservice plan create \
  --name aim-possible-plan \
  --resource-group aim-possible-rg \
  --sku B1 \
  --is-linux

# Create Backend Web App
az webapp create \
  --name aim-possible-backend \
  --resource-group aim-possible-rg \
  --plan aim-possible-plan \
  --runtime "NODE|18-lts"

# Create Frontend Web App
az webapp create \
  --name aim-possible-frontend \
  --resource-group aim-possible-rg \
  --plan aim-possible-plan \
  --runtime "NODE|18-lts"

# Configure Backend
az webapp config appsettings set \
  --resource-group aim-possible-rg \
  --name aim-possible-backend \
  --settings \
    PORT=8080 \
    NODE_ENV=production \
    FRONTEND_URL=https://aim-possible-frontend.azurewebsites.net

# Configure Frontend
az webapp config appsettings set \
  --resource-group aim-possible-rg \
  --name aim-possible-frontend \
  --settings \
    NODE_ENV=production

# Build and deploy
cd frontend
npm ci
VITE_API_URL=https://aim-possible-backend.azurewebsites.net npm run build

cd ../backend
npm ci --only=production

# Deploy using Azure CLI or zip deployment
```

## Application URLs

After deployment, your applications will be available at:

- **Frontend**: https://aim-possible-frontend.azurewebsites.net
- **Backend**: https://aim-possible-backend.azurewebsites.net
- **Backend Health Check**: https://aim-possible-backend.azurewebsites.net/health

## Environment Variables

### Backend Environment Variables
- `PORT`: Application port (set to 8080 for Azure)
- `NODE_ENV`: Environment (production)
- `FRONTEND_URL`: Frontend URL for CORS configuration
- `DB_PATH`: Database file path (optional, defaults to persistent storage)

### Frontend Environment Variables
- `VITE_API_URL`: Backend API URL (set during build)
- `NODE_ENV`: Environment (production)

## Monitoring and Troubleshooting

### View Application Logs
```bash
# Backend logs
az webapp log tail --resource-group aim-possible-rg --name aim-possible-backend

# Frontend logs
az webapp log tail --resource-group aim-possible-rg --name aim-possible-frontend
```

### Download Log Files
```bash
# Download backend logs
az webapp log download --resource-group aim-possible-rg --name aim-possible-backend

# Download frontend logs
az webapp log download --resource-group aim-possible-rg --name aim-possible-frontend
```

### Common Issues and Solutions

1. **CORS Errors**
   - Ensure `FRONTEND_URL` environment variable is set correctly
   - Check that the frontend URL is added to CORS allowed origins

2. **Database Issues**
   - Database files are stored in `$HOME/data/` for persistence
   - Check application logs for database connection errors

3. **Static File Issues**
   - Ensure web.config is properly configured
   - Check that static files are being served correctly

4. **Environment Variable Issues**
   - Verify all required environment variables are set
   - Check that `VITE_API_URL` is set during frontend build

## Scaling Considerations

### Horizontal Scaling
```bash
# Scale to multiple instances
az appservice plan update \
  --number-of-workers 2 \
  --resource-group aim-possible-rg \
  --name aim-possible-plan
```

### Vertical Scaling
```bash
# Upgrade to Standard plan for auto-scaling
az appservice plan update \
  --sku S1 \
  --resource-group aim-possible-rg \
  --name aim-possible-plan
```

## Security Considerations

1. **HTTPS Only**: Both applications are configured for HTTPS
2. **CORS**: Properly configured to allow only specific origins
3. **Request Filtering**: Configured in web.config to prevent malicious requests
4. **Environment Variables**: Sensitive configuration stored as app settings

## Database Considerations

The application currently uses SQLite for simplicity. For production at scale, consider:

1. **Azure SQL Database**: For better performance and reliability
2. **Azure Database for PostgreSQL**: Open-source alternative
3. **Azure Cosmos DB**: For NoSQL requirements

## Cost Optimization

1. **Use B1 plan** for development/testing (current configuration)
2. **Upgrade to S1** for production with auto-scaling
3. **Enable Application Insights** for monitoring (additional cost)
4. **Use Azure CDN** for static assets (if needed)

## Support

For issues with this deployment:

1. Check the GitHub Actions workflow logs
2. Review Azure App Service logs
3. Verify all environment variables are set correctly
4. Ensure the service principal has proper permissions 