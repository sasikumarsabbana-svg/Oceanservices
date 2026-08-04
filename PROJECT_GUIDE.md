# Knowledge Repository & SOP Management Guide

## 1. What this system is
This project is a Node.js + Express web app that manages:
- Operational knowledge documents
- Standard Operating Procedures (SOPs)
- Ocean service categories
- User access and activity logs

It is built to let regular users browse content and let administrators manage the system.

## 2. Main project parts
### Server
- `server.js` starts the web server.
- It uses Express to serve the frontend and expose APIs under `/api`.
- It also ensures upload folders exist (`uploads/documents`, `uploads/sop`).

### Routes
The API is split into route modules in `src/routes`:
- `auth.js` — login, logout, session check, authentication middleware.
- `services.js` — list, add, edit, delete ocean services.
- `documents.js` — list documents, upload documents, and track document downloads.
- `sops.js` — list SOPs, create SOPs, upload new SOP versions, and manage status.
- `logs.js` — view activity history.
- `dashboard.js` — summary metrics and recent activity.
- `users.js` — admin-only user management.

### Database abstraction
- `src/db/db.js` chooses the storage method.
- If MySQL env variables exist, it uses a real MySQL database.
- Otherwise it falls back to JSON file storage through `src/db/json_db.js`.

### Frontend
- `public/app.js` is the Single Page Application logic.
- It manages login, screen navigation, forms, filters, and API calls.
- It updates the UI based on whether the user is Admin or regular user.

## 3. How authentication works
### Login flow
- User sends email and password to `/api/auth/login`.
- The server checks credentials against `users` data.
- If valid, it creates a temporary session token and returns it.
- The frontend stores this token in `localStorage` as `auth_token`.

### Protected endpoints
- `requireAuth` middleware confirms a valid token exists.
- `requireAdmin` middleware confirms the user role is `Admin`.
- This prevents unauthorized users from accessing admin features.

## 4. File uploads and storage
### Documents
- PDFs are uploaded through `src/routes/documents.js`.
- Uploaded files are saved under `uploads/documents/`.
- Records in `documents` store file paths and metadata.

### SOP versions
- SOP PDF versions are uploaded through `src/routes/sops.js`.
- Files are saved under `uploads/sop/sop_<id>/`.
- Each new version gets a saved path and version details.

## 5. Activity logging
- The app writes actions into `activity_logs`.
- Common events logged:
  - login
  - logout
  - document download
  - SOP upload or version upload
- Logs help show who did what and support audits.

## 6. Useful files to know
- `server.js` — app startup and route mounting.
- `package.json` — dependencies and start script.
- `public/app.js` — frontend behavior and UI logic.
- `src/routes/auth.js` — authentication control and session handling.
- `src/routes/documents.js` — file upload routes and document API.
- `src/routes/sops.js` — SOP creation and version management.
- `src/db/db.js` — chooses between MySQL and JSON fallback.

## 7. How to run the project
1. Install dependencies: `npm install`
2. Start the app: `npm start`
3. Open browser at `http://localhost:3000`

If you want to use real MySQL data, set environment variables in a `.env` file:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Without those, the app uses local JSON storage.

## 8. How to use this guide for your own document
Use this document as a template.
- Copy each section and write your own words.
- Add notes on your project-specific terms.
- Keep sections short and clear.

## 9. Recommended structure for your own guide
1. Project purpose
2. Main modules
3. How users log in and access the system
4. How data is stored
5. How uploads work
6. What files are most important
7. How to start the app

## 10. Summary
This app is a simple knowledge repository built with:
- Express server
- Authentication middleware
- File upload support for documents and SOPs
- Admin vs user access control
- JSON fallback database if MySQL is not configured

Use this document to prepare your own guide by editing the sections and adding examples from your project.
