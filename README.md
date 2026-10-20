# Angular + Node.js

## Start the backend

In a terminal:

```powershell
cd backend
npm install
npm start
```

The API runs at `http://localhost:3000`. Its health endpoint is `GET /api/health`.

## Start the frontend

In a second terminal:

```powershell
cd Frontend/my-angular-app
npm install
npm start
```

Open the Angular URL printed in the terminal (usually `http://localhost:4200`) and select **Check backend**. Angular proxies `/api` requests to port `3000` during development, so the browser does not need CORS configuration.
