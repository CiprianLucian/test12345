# Azure Deployment Troubleshooting Guide

## Common Frontend Deployment Issues

### Issue: "Failed to deploy web package to App Service" - ZIP Deploy Error

#### Symptoms
- GitHub Actions shows: `Package deployment using ZIP Deploy initiated.`
- Error: `Failed to deploy web package to App Service.`
- Error: `Deployment Failed, Package deployment using ZIP Deploy failed.`

#### Root Causes & Solutions

1. **Missing server.js or package.json in dist folder**
   - **Cause**: The postbuild script didn't run properly
   - **Check**: Look at the build logs for frontend build step
   - **Solution**: Ensure the `npm run build` command runs successfully and the postbuild script executes

2. **Incorrect App Service Configuration**
   - **Cause**: App Service is misconfigured for Node.js deployment
   - **Solution**: Verify these settings in the deployment workflow:
     ```yaml
     WEBSITE_RUN_FROM_PACKAGE=0
     WEBSITE_NODE_DEFAULT_VERSION=~18
     startup-file: "node server.js"
     ```

3. **Dependencies Installation Issues**
   - **Cause**: npm install fails in the dist folder
   - **Solution**: Check the build step for proper package.json creation

#### Debugging Steps

1. **Check Build Output**
   ```bash
   # In the GitHub Actions logs, look for:
   echo "Checking dist folder contents..."
   ls -la dist/
   ```

2. **Verify Required Files**
   The dist folder should contain:
   - `index.html` (from Vite build)
   - `server.js` (copied by postbuild script)
   - `package.json` (created by postbuild script)
   - `assets/` folder (from Vite build)
   - `node_modules/` (after npm install)

3. **Check App Service Logs**
   ```bash
   az webapp log download --resource-group RESOURCE_GROUP --name APP_NAME
   ```

4. **Manual Test**
   Test locally with the same setup:
   ```bash
   cd frontend
   npm install
   npm run build
   cd dist
   ls -la  # Should show server.js and package.json
   npm install --omit=dev
   node server.js  # Should start the server
   ```

#### Quick Fixes

1. **Force Rebuild**
   - Re-run the GitHub Action
   - Clear npm cache if needed

2. **Check Postbuild Script**
   Ensure the postbuild script in `frontend/package.json` is correct:
   ```json
   "postbuild": "node -e \"const pkg = require('./package.json'); const prodPkg = { name: pkg.name, version: pkg.version, scripts: { start: 'node server.js' }, dependencies: { express: pkg.dependencies.express, axios: pkg.dependencies.axios, react: pkg.dependencies.react, 'react-dom': pkg.dependencies['react-dom'], 'react-router-dom': pkg.dependencies['react-router-dom'] } }; require('fs').writeFileSync('dist/package.json', JSON.stringify(prodPkg, null, 2)); require('fs').copyFileSync('server.js', 'dist/server.js')\""
   ```

3. **Verify Express Dependency**
   Make sure `express` is listed in the main dependencies (not devDependencies):
   ```json
   "dependencies": {
     "express": "^4.18.2",
     ...
   }
   ```

## General Azure Deployment Tips

### App Service Configuration
- Use `WEBSITE_RUN_FROM_PACKAGE=0` for custom deployments
- Set appropriate Node.js version: `WEBSITE_NODE_DEFAULT_VERSION=~18`
- Configure startup file correctly: `node server.js`

### GitHub Actions Best Practices
- Add proper error checking and logging
- Use retry logic for health checks
- Wait sufficient time for deployment completion (60+ seconds)
- Download logs on failure for debugging

### Common Environment Variables
```yaml
NODE_ENV=production
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=~18
SCM_DO_BUILD_DURING_DEPLOYMENT=false
ENABLE_ORYX_BUILD=false
```

## Getting Help
1. Check GitHub Actions logs first
2. Download Azure App Service logs
3. Test the build process locally
4. Verify all required files are present in the deployment package 