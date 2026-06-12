# Deployment Guide

This guide explains how to deploy the project to a public hosting provider.

## Prerequisites

- A Git repository with this project committed.
- Node.js app with `package.json` containing `start` script: `node server.js`.
- Server listens on `process.env.PORT || 3000` (already configured in `server.js`).

## Recommended services

### Render

1. Create an account at https://render.com.
2. Click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - Environment: `Node`
   - Build command: `npm install`
   - Start command: `npm start`
5. Deploy.
6. Render provides a public URL once the deployment finishes.

### Railway

1. Create an account at https://railway.app.
2. Create a new project and connect your GitHub repository.
3. Configure the service with `npm install` and `npm start`.
4. Railway assigns a public URL after deployment.

### Heroku

1. Create an account at https://heroku.com.
2. Install the Heroku CLI if needed.
3. Create a new app:
   ```bash
   heroku create
   ```
4. Push to Heroku:
   ```bash
   git push heroku main
   ```
5. Open the app:
   ```bash
   heroku open
   ```

### Vercel

1. Create an account at https://vercel.com.
2. Import the Git repository.
3. Select `npm install` as build and `npm start` as the start command.
4. Vercel provides a public URL.

## Notes for deployment

- If the service requires a `PORT` variable, the app already uses `process.env.PORT || 3000`.
- If you deploy to a platform that only supports static sites, this application needs a Node backend and cannot work as a static-only app.
- Make sure all required files are committed: `server.js`, `public/`, `src/`, `package.json`, and `package-lock.json`.

## Quick troubleshooting

- If deployment fails due to missing dependencies, run locally:
  ```bash
  npm install
  npm start
  ```
- If the app does not start, check for errors in the service logs.
- If the wrong port is used, verify `server.js` contains:
  ```js
  const PORT = process.env.PORT || 3000;
  ```
