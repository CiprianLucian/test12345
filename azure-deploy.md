# Azure Deployment Guide

## Prerequisites

1. Azure account with an active subscription
2. Azure CLI installed
3. Node.js and npm installed
4. Git installed

## Deployment Steps

### 1. Prepare the Application

1. Build the frontend:
```bash
cd frontend
npm install
npm run build
```

2. Move the frontend build to the backend:
```bash
mkdir -p ../backend/public
cp -r dist/* ../backend/public/
```

### 2. Set Up Azure Resources

1. Login to Azure:
```bash
az login
```

2. Create a resource group:
```bash
az group create --name aim-possible-rg --location westeurope
```

3. Create an App Service plan:
```bash
az appservice plan create --name aim-possible-plan --resource-group aim-possible-rg --sku B1 --is-linux
```

4. Create a Web App:
```bash
az webapp create --resource-group aim-possible-rg --plan aim-possible-plan --name aim-possible-app --runtime "NODE|18-lts"
```

### 3. Configure the Web App

1. Set environment variables:
```bash
az webapp config appsettings set --resource-group aim-possible-rg --name aim-possible-app --settings PORT=8080
```

2. Enable logging:
```bash
az webapp log config --resource-group aim-possible-rg --name aim-possible-app --web-server-logging filesystem
```

### 4. Deploy the Application

1. Initialize Git in your project (if not already done):
```bash
git init
git add .
git commit -m "Prepare for Azure deployment"
```

2. Get the deployment credentials:
```bash
az webapp deployment source config-local-git --resource-group aim-possible-rg --name aim-possible-app
```

3. Add Azure as a remote and push:
```bash
git remote add azure <URL_FROM_PREVIOUS_COMMAND>
git push azure master
```

### 5. Monitor the Application

1. Check application logs:
```bash
az webapp log tail --resource-group aim-possible-rg --name aim-possible-app
```

2. Monitor the application:
- Go to Azure Portal
- Navigate to your Web App
- Click on "Monitoring" section

### Important Notes

1. The application uses SQLite which stores data in a file. In production, consider:
   - Using Azure SQL Database instead
   - Or, mounting a persistent storage for SQLite

2. The frontend API_URL needs to be updated to point to the production backend

3. For better security:
   - Add authentication
   - Enable HTTPS
   - Set up proper CORS policies

### Scaling Considerations

1. The B1 plan allows for manual scaling. To scale:
```bash
az appservice plan update --number-of-workers 2 --resource-group aim-possible-rg --name aim-possible-plan
```

2. For automatic scaling, consider upgrading to a Standard plan (S1)
