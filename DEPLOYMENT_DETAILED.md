# Detailed Deployment & Presentation Guide

This document expands the basic deployment information and includes step-by-step instructions, examples, a Docker option, process manager configs, verification checks, and presentation tips to explain the deployment to your guide.

---

## 1) Goals of this guide

- Run the application locally for testing.
- Deploy to a cloud platform or VM for production.
- Configure a production-grade setup (process manager, proxy, secure DB).
- Provide a reproducible containerized deployment (Docker).
- Explain the deployment to a reviewer with clarity and evidence.

---

## 2) Quick local run (tested)

Requirements:
- Node.js 20+

Commands:

```powershell
npm install
npm start
```

Verification:
- Frontend: `http://localhost:3000/`
- API: `http://localhost:3000/api/categories`

Logs: look for message: `Server running locally at: http://localhost:3000` and database mode line.

---

## 3) Environment variables and database

Modes supported:
- Local JSON fallback (default) — uses `data/db_fallback`.
- MySQL — enabled by `DB_HOST` and `DB_NAME`.

Recommended variables (example):

```bash
DB_HOST=127.0.0.1
DB_NAME=ors_db
DB_USER=ors_user
DB_PASS=strong_password
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

Security: keep DB credentials in an environment file or secrets manager. Never commit credentials.

---

## 4) Production: systemd service (example)

Create `/etc/systemd/system/ors.service` on a Linux VM:

```
[Unit]
Description=Operational Ocean Services API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ors
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Commands to enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ors.service
sudo journalctl -u ors.service -f
```

---

## 5) Production: PM2 (example)

Install PM2 and start:

```bash
npm install -g pm2
pm2 start server.js --name ors --env production
pm2 save
pm2 startup
```

View logs:

```bash
pm2 logs ors
```

---

## 6) Containerization: Dockerfile and docker-compose

Example `Dockerfile`:

```
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Example `docker-compose.yml` (with MySQL):

```
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_NAME=ors_db
      - DB_USER=ors_user
      - DB_PASS=ors_pass
    depends_on:
      - db
    volumes:
      - ./uploads:/usr/src/app/uploads

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ors_db
      MYSQL_USER: ors_user
      MYSQL_PASSWORD: ors_pass
      MYSQL_ROOT_PASSWORD: root_pass
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Notes: mount persistent volumes for uploads and DB data. Secure credentials with environment variables or secrets.

---

## 7) Reverse proxy example (Nginx)

Use Nginx to terminate TLS and proxy to the app on localhost:3000.

```
server {
  listen 80;
  server_name example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name example.com;

  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /uploads/ {
    alias /opt/ors/uploads/;
  }
}
```

---

## 8) Health checks and verification

- Request `GET /api/categories` and expect JSON array.
- Test login endpoints (if demo creds available) and exercise key flows: upload document, download tracking, list SOPs.
- Confirm uploads are written to `uploads/documents` and `uploads/sop`.
- Confirm logs (console or PM2/systemd) show no unexpected errors.

---

## 9) Backups and persistence

- Backup MySQL daily and keep off-site copies.
- Backup `uploads/` directory frequently.
- For JSON fallback mode, commit copies of the `data/db_fallback` files to a secure backup location.

---

## 10) Checklist to present to your guide

- [ ] Repo cloned and dependencies installed.
- [ ] App runs locally on `http://localhost:3000/`.
- [ ] Database mode verified (MySQL or JSON fallback).
- [ ] Uploaded files persist across restarts (or explained why not).
- [ ] Logs accessible and monitored.
- [ ] Deployment approach chosen (VM with systemd / PM2 or container).
- [ ] TLS and reverse proxy configured.
- [ ] Backup and restore plan documented.

When presenting, show live demo, then share the checklist and links to commands run. Keep output windows visible (terminal + browser).

---

## 11) How to explain to your guide (script and tips)

Start with the purpose:
- "This application is a Knowledge Repository and SOP manager for Operational Ocean Services. It provides a web UI and REST APIs for managing documents and SOPs."

Explain local run and verification quickly:
- Show `npm install` and `npm start`, then the homepage and `/api/categories` response.

Explain production concerns:
- State that for production we'll run behind Nginx with TLS, use a process manager or container, and a MySQL database with secure credentials.

Demonstration steps:
1. Show server logs.
2. Upload a file and show that the file appears in `uploads/` and in the UI.
3. Show database entries (or JSON files) to confirm persistence.

Answering likely questions:
- "How are uploads stored?" → `uploads/` folder on the server or a shared storage when scaled.
- "How to scale?" → containerize + orchestrate (Kubernetes) and use shared object storage (S3) and managed DB.

---

## 12) Common errors and fixes

- Port conflict: set `PORT` env var or stop existing service.
- DB connection refused: ensure `DB_HOST`/`DB_NAME` correct and DB accessible.
- Permission errors writing `uploads/`: ensure the process user has write permissions.

---

## 13) Optional: Dockerized demo steps (quick)

```bash
# build
docker-compose build
# bring up
docker-compose up -d
# view logs
docker-compose logs -f app
```

---

## 14) Want me to produce?

- A `Dockerfile` + `docker-compose.yml` added to repo (I can create these files).
- A `systemd` unit file or `pm2` start script.
- A prettier PDF with embedded fonts and styling.

Tell me which and I'll add it and generate the corresponding PDF.
