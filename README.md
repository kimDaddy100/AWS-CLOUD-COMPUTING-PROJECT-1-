# Task Manager — 3-Tier Web App on AWS

A full-stack Task Manager app built as a cloud computing project.

```
Frontend  →  React + Vite         →  AWS S3 + CloudFront
Backend   →  Node.js + Express    →  AWS Elastic Beanstalk (Docker)
Database  →  PostgreSQL           →  AWS RDS (private VPC subnet)
CI/CD     →  GitHub Actions       →  auto-deploys on git push to main
```

---

## Project Structure

```
taskmanager/
├── frontend/                  # React app (Tier 1 — Presentation)
│   ├── src/
│   │   ├── App.jsx            # Main component + state management
│   │   ├── api.js             # All fetch calls to the backend
│   │   ├── index.css          # Global styles
│   │   └── components/
│   │       ├── TaskForm.jsx   # Add new task form
│   │       └── TaskCard.jsx   # Single task card (update/delete)
│   ├── index.html
│   ├── vite.config.js         # Dev proxy: /api → localhost:3000
│   └── package.json
│
├── backend/                   # Express API (Tier 2 — Application)
│   ├── src/
│   │   ├── server.js          # Express app + middleware
│   │   ├── db.js              # PostgreSQL pool + table init
│   │   └── routes/
│   │       └── tasks.js       # CRUD routes for /api/tasks
│   ├── Dockerfile             # Multi-stage Docker build
│   ├── Dockerrun.aws.json     # Elastic Beanstalk Docker config
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD: build + deploy on push to main
├── docker-compose.yml         # Run everything locally (one command)
└── README.md
```

---

## Running Locally (Recommended First Step)

### Option A — Docker Compose (easiest, one command)

Requirements: Docker Desktop installed and running.

```bash
# Clone the repo and start everything
docker compose up --build
```

- Frontend: http://localhost:5173
- API:      http://localhost:3000
- Database: localhost:5432

```bash
# Stop everything
docker compose down

# Stop and delete the database volume (fresh start)
docker compose down -v
```

### Option B — Manual (no Docker)

Requirements: Node.js 18+ and PostgreSQL installed locally.

**1. Start the database**
```bash
# Create the database in psql
psql -U postgres -c "CREATE DATABASE taskmanager;"
```

**2. Start the backend**
```bash
cd backend
cp .env.example .env       # edit .env if your postgres credentials differ
npm install
npm run dev                # runs on port 3000, auto-restarts on file changes
```

**3. Start the frontend**
```bash
cd frontend
npm install
npm run dev                # runs on port 5173, proxies /api to port 3000
```

Open http://localhost:5173.

---

## API Reference

Base URL in production: `https://your-eb-env.elasticbeanstalk.com`

| Method | Endpoint         | Body                                      | Description        |
|--------|------------------|-------------------------------------------|--------------------|
| GET    | /api/tasks       | —                                         | Get all tasks      |
| GET    | /api/tasks?status=pending | —                                | Filter by status   |
| GET    | /api/tasks/:id   | —                                         | Get one task       |
| POST   | /api/tasks       | `{ title, description?, priority? }`      | Create task        |
| PATCH  | /api/tasks/:id   | `{ title?, description?, status?, priority? }` | Update task   |
| DELETE | /api/tasks/:id   | —                                         | Delete task        |
| GET    | /health          | —                                         | Health check       |

**Task status values:** `pending` → `in_progress` → `done`
**Priority values:** `low` · `medium` · `high`

---

## Deploying to AWS (Step by Step)

### Prerequisites
- AWS account (aws.amazon.com) — use ATM card or virtual card
- AWS CLI installed: `npm install -g aws-cdk` or download from AWS docs
- Configure CLI: `aws configure` (enter your Access Key ID and Secret)

---

### Step 1 — Create the RDS PostgreSQL Database

1. Go to **AWS Console → RDS → Create database**
2. Choose: Standard Create, **PostgreSQL**, Free Tier template
3. Settings:
   - DB instance identifier: `taskmanager-db`
   - Master username: `postgres`
   - Master password: (choose a strong password, save it!)
4. Connectivity:
   - Use the **default VPC**
   - Public access: **No** (keeps DB private)
5. Click **Create database** — takes ~5 minutes
6. Once created, copy the **Endpoint** address (e.g. `taskmanager-db.xxxx.us-east-1.rds.amazonaws.com`)

---

### Step 2 — Deploy the Frontend to S3 + CloudFront

**Create S3 bucket:**
```bash
aws s3 mb s3://taskmanager-frontend-yourname --region us-east-1
```

**Build the React app:**
```bash
cd frontend
# Set VITE_API_URL to your Elastic Beanstalk URL (fill in after Step 3)
echo "VITE_API_URL=http://your-eb-url.elasticbeanstalk.com" > .env
npm run build
```

**Upload to S3:**
```bash
aws s3 sync dist/ s3://taskmanager-frontend-yourname --delete
```

**Create CloudFront distribution:**
1. Go to **AWS Console → CloudFront → Create distribution**
2. Origin: your S3 bucket
3. Default root object: `index.html`
4. Redirect HTTP to HTTPS: **Yes**
5. Click **Create distribution**
6. After ~5 minutes, you get a URL like `https://d1234abc.cloudfront.net` — this is your app's public URL

---

### Step 3 — Deploy the Backend to Elastic Beanstalk

**Create the application:**
```bash
# Install EB CLI
pip install awsebcli

cd backend
eb init taskmanager --platform docker --region us-east-1
eb create taskmanager-env
```

**Set environment variables (database credentials):**
```bash
eb setenv \
  DB_HOST=taskmanager-db.xxxx.us-east-1.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_NAME=taskmanager \
  DB_USER=postgres \
  DB_PASSWORD=your-rds-password \
  DB_SSL=true \
  FRONTEND_URL=https://d1234abc.cloudfront.net
```

**Deploy:**
```bash
eb deploy
```

Elastic Beanstalk will build your Docker image, start the container on EC2, and give you a URL like `http://taskmanager-env.us-east-1.elasticbeanstalk.com`.

---

### Step 4 — Set up CI/CD with GitHub Actions

**Add these secrets to your GitHub repo** (Settings → Secrets and Variables → Actions):

| Secret Name         | Value                                   |
|---------------------|-----------------------------------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key                     |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key                |
| `EB_URL`            | Your Elastic Beanstalk URL              |
| `CF_DISTRIBUTION_ID` | Your CloudFront distribution ID        |

**Update the workflow file** (`.github/workflows/deploy.yml`):
- Change `S3_BUCKET` to your actual bucket name
- Change `EB_APP_NAME` and `EB_ENV_NAME` to match what you created

After this, every `git push` to `main` will automatically:
1. Build the React app
2. Upload it to S3
3. Invalidate the CloudFront cache
4. Package and deploy the backend to Elastic Beanstalk

---

## Environment Variables Reference

### Backend (.env)
| Variable      | Default      | Description                    |
|---------------|--------------|--------------------------------|
| `PORT`        | 3000         | Express server port            |
| `DB_HOST`     | localhost    | PostgreSQL host                |
| `DB_PORT`     | 5432         | PostgreSQL port                |
| `DB_NAME`     | taskmanager  | Database name                  |
| `DB_USER`     | postgres     | Database user                  |
| `DB_PASSWORD` | postgres     | Database password              |
| `DB_SSL`      | false        | Set to `true` on AWS RDS       |
| `FRONTEND_URL`| *           | CORS allowed origin             |

### Frontend (.env)
| Variable       | Default | Description                           |
|----------------|---------|---------------------------------------|
| `VITE_API_URL` | (empty) | Backend URL. Empty = use Vite proxy   |
