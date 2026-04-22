# Municipal Complaint Platform Frontend

## Overview
This frontend is a React + Vite application for the municipal complaint platform. It includes a public home page, authentication screens, and role-based dashboards for citizens, administrators, and municipal agents.

## Stack
- React 19
- Vite 8
- React Router 7
- Axios
- Leaflet / React Leaflet
- Recharts
- Tailwind CSS 4
- ESLint 9

## Main Features
- Public home page with service overview, recent complaint highlights, and summary counters loaded from `GET /api/complaints/public/home`
- JWT-based authentication for citizens, agents, and administrators
- Automatic cleanup of expired or invalid stored sessions so guest actions such as `Sign In` remain visible on the public home page
- Citizen complaint submission with category selection, GPS capture, street-name fallback, and optional image upload
- Citizen complaint tracking, resolution visibility, and feedback submission
- Administrator dashboard and analytics views
- Agent dashboard for assigned complaints, field evidence upload, and resolution updates

## Routes
- Public:
	- `/`
	- `/login`
	- `/register`
- Citizen:
	- `/citizen`
	- `/citizen/submit`
	- `/citizen/complaints`
- Admin:
	- `/admin`
	- `/admin/analytics`
- Agent:
	- `/agent`

## Prerequisites
- Node.js 22+ recommended
- npm
- Backend API available at `http://localhost:8080/api` or another URL exposed through `VITE_API_BASE_URL`

## Environment
The frontend uses this API base URL resolution order:

1. `VITE_API_BASE_URL`
2. Fallback: `http://localhost:8080/api`

Example `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

## Local Development
1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app in your browser. Vite usually serves it on `http://localhost:5173`.

## Available Scripts
- `npm run dev`: start the Vite development server
- `npm run build`: create the production build in `dist/`
- `npm run lint`: run ESLint
- `npm run preview`: preview the production build locally

## Docker
From the repository root, build and run the frontend together with the backend:

```bash
docker compose up -d --build backend frontend
```

With the repository Docker setup:
- Frontend is served by Nginx on `http://localhost:5173`
- Backend is exposed on `http://localhost:8080`

## Project Structure
- `src/api/axios.js`: shared Axios client and auth interceptors
- `src/context/`: auth bootstrap and context hooks
- `src/pages/home/`: public landing page
- `src/pages/auth/`: login and registration screens
- `src/pages/citizen/`: citizen dashboard, complaint submission, complaint history
- `src/pages/admin/`: administrator dashboard and analytics
- `src/pages/agent/`: agent dashboard and task handling
- `src/routes/ProtectedRoute.jsx`: role-aware route protection

## Notes
- Complaint photo uploads must be image files. Non-image uploads are rejected by the backend.
- Complaint submission supports either GPS coordinates or a `streetName` fallback when GPS is unavailable.
- Unauthenticated users are redirected to the public home page, not to a protected dashboard.
