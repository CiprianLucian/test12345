# Build and deploy script for Azure

# Check if Azure CLI is installed, if not prompt to install it
$azCliInstalled = $null
try {
    $azCliInstalled = Get-Command az -ErrorAction SilentlyContinue
} catch {
    # Command not found, continue with script
}

if ($null -eq $azCliInstalled) {
    Write-Host "Azure CLI is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "You have an Azure CLI installer in the backend folder." -ForegroundColor Yellow
    
    $installChoice = Read-Host "Do you want to install Azure CLI now? (Y/N)"
    if ($installChoice -eq "Y" -or $installChoice -eq "y") {
        Write-Host "Installing Azure CLI..." -ForegroundColor Cyan
        Start-Process -FilePath ".\backend\AzureCLI.msi" -Wait
        Write-Host "Azure CLI installation completed. Please restart this script." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Azure CLI is required for deployment. Please install it and run this script again." -ForegroundColor Red
        exit 1
    }
}

# Configuration
$config = @{
    frontendUrl = "https://aim-possible-frontend.azurewebsites.net"
    backendUrl = "https://aim-possible-backend.azurewebsites.net"
    resourceGroup = "aim-possible-rg"
    location = "westeurope"
    appServicePlan = "aim-possible-plan" 
    appName = "aim-possible-app"
    sku = "B1"
    runtime = "NODE|18-lts"  # Changed from 22-lts to 18-lts for better compatibility
}

# Error handling function
function Invoke-ErrorHandler {
    param($ErrorMessage)
    Write-Host "Error: $ErrorMessage" -ForegroundColor Red
    exit 1
}

Write-Host "1. Building frontend..." -ForegroundColor Cyan
try {
    Set-Location -Path ".\frontend"
    npm install
    if ($LASTEXITCODE -ne 0) { Invoke-ErrorHandler "Frontend npm install failed" }
    npm run build
    if ($LASTEXITCODE -ne 0) { Invoke-ErrorHandler "Frontend build failed" }
} catch {
    Invoke-ErrorHandler $_.Exception.Message
}

Write-Host "2. Preparing backend..."
# Create public directory in backend if it doesn't exist
New-Item -ItemType Directory -Force -Path "..\backend\public"
# Copy frontend build to backend public folder
Copy-Item -Path ".\dist\*" -Destination "..\backend\public" -Recurse -Force

Write-Host "3. Installing backend dependencies..."
Set-Location -Path "..\backend"
npm install --production

Write-Host "4. Creating deployment package..."
# Create a temporary deployment folder
New-Item -ItemType Directory -Force -Path "..\deploy"
# Copy backend files
Copy-Item -Path ".\*" -Destination "..\deploy" -Recurse -Force
# Exclude node_modules and any development files
Remove-Item -Path "..\deploy\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "..\deploy\.env" -Force -ErrorAction SilentlyContinue

Write-Host "Deployment package created successfully!" -ForegroundColor Green

# Azure Deployment Section
Write-Host "5. Deploying to Azure..." -ForegroundColor Cyan

# Verify Azure CLI installation
Write-Host "Verifying Azure CLI installation..." -ForegroundColor Cyan
try {
    $azCliVersion = az version --output json
    if ($LASTEXITCODE -ne 0) {
        Invoke-ErrorHandler "Azure CLI check failed. Please ensure Azure CLI is properly installed."
    }
    $azCliVersionObj = $azCliVersion | ConvertFrom-Json
    Write-Host "Azure CLI is installed. Version: $($azCliVersionObj.'azure-cli')" -ForegroundColor Green
} catch {
    Invoke-ErrorHandler "Azure CLI is not available or not in PATH. Please ensure Azure CLI is installed. Error: $($_.Exception.Message)"
}

# Login to Azure
Write-Host "Logging in to Azure..." -ForegroundColor Cyan
try {
    az login --use-device-code
    if ($LASTEXITCODE -ne 0) { Invoke-ErrorHandler "Azure login failed" }
    
    # Verify login was successful
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "Logged in as: $($account.user.name) (Subscription: $($account.name))" -ForegroundColor Green
} catch {
    Invoke-ErrorHandler "Azure login failed: $($_.Exception.Message)"
}

# Create resource group if it doesn't exist
Write-Host "Checking/creating resource group '$($config.resourceGroup)'..." -ForegroundColor Cyan
try {
    $rgExists = az group exists --name $config.resourceGroup
    if ($rgExists -eq "false") {
        Write-Host "Resource group doesn't exist. Creating..." -ForegroundColor Yellow
        az group create --name $config.resourceGroup --location $config.location
        if ($LASTEXITCODE -ne 0) { 
            Invoke-ErrorHandler "Resource group creation failed with exit code $LASTEXITCODE" 
        }
    } else {
        Write-Host "Resource group already exists." -ForegroundColor Green
    }
} catch {
    Invoke-ErrorHandler "Resource group operation failed: $($_.Exception.Message)"
}

# Create App Service Plan if it doesn't exist
Write-Host "Checking/creating App Service Plan '$($config.appServicePlan)'..." -ForegroundColor Cyan
try {
    $planCheck = az appservice plan list --resource-group $config.resourceGroup --query "[?name=='$($config.appServicePlan)']" --output json
    if ($planCheck -eq "[]") {
        Write-Host "App Service Plan doesn't exist. Creating..." -ForegroundColor Yellow
        az appservice plan create --name $config.appServicePlan --resource-group $config.resourceGroup --sku $config.sku --is-linux
        if ($LASTEXITCODE -ne 0) { 
            Invoke-ErrorHandler "App Service Plan creation failed with exit code $LASTEXITCODE" 
        }
    } else {
        Write-Host "App Service Plan already exists." -ForegroundColor Green
    }
} catch {
    Invoke-ErrorHandler "App Service Plan operation failed: $($_.Exception.Message)"
}

# Create Web App if it doesn't exist
Write-Host "Checking/creating Web App '$($config.appName)'..." -ForegroundColor Cyan
try {
    $appCheck = az webapp list --resource-group $config.resourceGroup --query "[?name=='$($config.appName)']" --output json
    if ($appCheck -eq "[]") {
        Write-Host "Web App doesn't exist. Creating..." -ForegroundColor Yellow
        az webapp create --resource-group $config.resourceGroup --plan $config.appServicePlan --name $config.appName --runtime $config.runtime
        if ($LASTEXITCODE -ne 0) { 
            Invoke-ErrorHandler "Web App creation failed with exit code $LASTEXITCODE" 
        }
    } else {
        Write-Host "Web App already exists." -ForegroundColor Green
    }
} catch {
    Invoke-ErrorHandler "Web App operation failed: $($_.Exception.Message)"
}

# Configure Web App settings
Write-Host "Configuring Web App settings..." -ForegroundColor Cyan
try {
    az webapp config appsettings set --resource-group $config.resourceGroup --name $config.appName --settings NODE_ENV=production PORT=8080
    if ($LASTEXITCODE -ne 0) { 
        Invoke-ErrorHandler "Web App configuration failed with exit code $LASTEXITCODE" 
    }
} catch {
    Invoke-ErrorHandler "Web App configuration failed: $($_.Exception.Message)"
}

# Deploy the app using ZIP deploy
Write-Host "Creating and deploying ZIP package..." -ForegroundColor Cyan
try {
    # Create a ZIP file of the deploy folder
    Set-Location -Path "..\deploy"
    Compress-Archive -Path .\* -DestinationPath ..\deploy.zip -Force
    
    # Verify the ZIP file was created successfully
    if (-not (Test-Path -Path "..\deploy.zip")) {
        Invoke-ErrorHandler "Failed to create deployment ZIP file"
    }
    $zipSize = (Get-Item "..\deploy.zip").Length / 1MB
    Write-Host "ZIP package created successfully. Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
    
    # Set higher timeout for deployment
    Write-Host "Setting Azure CLI timeout to 600 seconds..." -ForegroundColor Yellow
    $env:AZURE_CLI_COMMAND_TIMEOUT = 600
    
    # Display deployment command details
    Write-Host "Running deployment command: az webapp deployment source config-zip --resource-group $($config.resourceGroup) --name $($config.appName) --src ..\deploy.zip" -ForegroundColor Yellow
    
    # Deploy using ZIP deploy
    Write-Host "Deploying ZIP package to Azure..." -ForegroundColor Yellow
    $deploymentOutput = az webapp deployment source config-zip --resource-group $config.resourceGroup --name $config.appName --src ..\deploy.zip --debug 2>&1
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "Deployment command output: $deploymentOutput" -ForegroundColor Red
        Invoke-ErrorHandler "Deployment failed with exit code $LASTEXITCODE" 
    }
    
    # Clean up
    Remove-Item -Path ..\deploy.zip -Force
    Write-Host "ZIP package deployed successfully." -ForegroundColor Green
} catch {
    Write-Host "Exception details: $($_.Exception)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    Invoke-ErrorHandler "Deployment failed: $($_.Exception.Message)"
}

# Return to the original directory
Set-Location -Path "..\."

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Frontend URL: $($config.frontendUrl)" -ForegroundColor Cyan
Write-Host "Backend URL: $($config.backendUrl)" -ForegroundColor Cyan

# Function to create a fallback deployment if the primary method fails
function Invoke-FallbackDeployment {
    Write-Host "Primary deployment method failed. Trying alternative deployment method..." -ForegroundColor Yellow
    
    # Fallback method: Use FTP deployment
    try {
        # Get publishing profile
        Write-Host "Getting publishing credentials..." -ForegroundColor Cyan
        $pubProfile = az webapp deployment list-publishing-profiles --resource-group $config.resourceGroup --name $config.appName --output json | ConvertFrom-Json
        $ftpProfile = $pubProfile | Where-Object { $_.publishMethod -eq "FTP" } | Select-Object -First 1
        
        if ($null -eq $ftpProfile) {
            Write-Host "Could not retrieve FTP publishing profile. Fallback deployment failed." -ForegroundColor Red
            return $false
        }
        
        Write-Host "FTP profile retrieved. Attempting FTP deployment..." -ForegroundColor Cyan
        # Instead of actual FTP upload (which requires additional tools), let's use az webapp deploy
        Write-Host "Attempting alternative deployment using az webapp deploy..." -ForegroundColor Cyan
        az webapp deploy --resource-group $config.resourceGroup --name $config.appName --src-path ..\deploy.zip --type zip
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Alternative deployment succeeded!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Alternative deployment failed with exit code $LASTEXITCODE" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Alternative deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}
