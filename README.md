# Taskly – Task Manager (MERN)

A simple, clean task manager where each user can sign up, log in and manage their own tasks.

- **Live app:** https://taskly-sejal.netlify.app
- **API:** https://task-manager-api-rhy9.onrender.com (health check: `/api/health`)
- **Source code:** https://github.com/sejalbhawsar6/task-manager

> **Note:** The backend runs on Render's free plan. If the app has not been used for a while, the first request can take up to a minute while the server wakes up. The app shows a "waking up" message during this time.

## Features

- Sign up / log in with JWT authentication (passwords hashed with bcrypt)
- Create, edit and delete tasks (title, description, priority, status, due date)
- Mark tasks done with one click, or change status from the card
- Search tasks, filter by status and priority, sort by newest, oldest, due date or priority
- Dashboard stats (total, to do, in progress, completed, overdue) with a progress bar
- Overdue and "due today" highlights
- Light and dark mode, fully responsive (mobile and desktop)
- Friendly loading, empty and error states, toast notifications

## Tech stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React (Vite), React Router, Axios, lucide-react |
| Backend  | Node.js, Express                                |
| Database | MongoDB Atlas with Mongoose                     |
| Auth     | JWT + bcryptjs                                  |
| Hosting  | Netlify (frontend), Render (backend)            |

## Project structure

```
task-manager/
├── backend/
│   ├── server.js              # Starts the server after connecting to MongoDB
│   └── src/
│       ├── app.js             # Express app, CORS, routes, error handling
│       ├── config/db.js
│       ├── models/            # User, Task
│       ├── controllers/       # authController, taskController
│       ├── routes/            # /api/auth, /api/tasks
│       ├── middleware/        # JWT auth, error handler
│       └── utils/
└── frontend/
    └── src/
        ├── api/client.js      # Axios instance with token + error helper
        ├── context/           # AuthContext, ToastContext
        ├── hooks/             # useTheme, useDebounce, useSlowHint
        ├── pages/             # Login, Register, Dashboard
        ├── components/        # TaskCard, TaskModal, Toolbar, StatsCards, ...
        └── index.css          # Design tokens + all styles
```

## Run locally

Requirements: Node.js 18+ and a MongoDB Atlas connection string.

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run dev               # http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```

## Deployment

- **Database:** MongoDB Atlas (free M0 cluster).
- **Backend:** Render web service with root directory `backend`, build command `npm install`, start command `npm start`. Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`.
- **Frontend:** Netlify. `VITE_API_URL` is set in `frontend/.env.production`, and `public/_redirects` makes page refreshes work with React Router.

## API

All task routes need the header `Authorization: Bearer <token>`.

| Method | Route                | Description                                               |
| ------ | -------------------- | --------------------------------------------------------- |
| POST   | `/api/auth/register` | Create account → `{ token, user }`                        |
| POST   | `/api/auth/login`    | Log in → `{ token, user }`                                |
| GET    | `/api/auth/me`       | Current user                                              |
| GET    | `/api/tasks`         | List tasks. Query: `status`, `priority`, `search`, `sort` |
| GET    | `/api/tasks/stats`   | Counts by status + overdue. Query: `today=YYYY-MM-DD`     |
| POST   | `/api/tasks`         | Create task                                               |
| PUT    | `/api/tasks/:id`     | Update task (only the owner can)                          |
| DELETE | `/api/tasks/:id`     | Delete task (only the owner can)                          |
| GET    | `/api/health`        | Health check                                              |

## Key decisions

1. **MERN with a separate REST API.** The frontend and backend are independent, so the same API could later serve a mobile app.
2. **Authentication with per-user data.** Every task query is filtered by the logged-in user, so users can never see or edit each other's tasks.
3. **Filtering and searching on the server.** The API does the filtering, so the app stays fast as the task list grows.

## What I chose not to implement

1. **Team sharing / assigning tasks to others.** It needs roles and permissions, which is a much bigger scope than a personal task manager.
2. **Drag-and-drop Kanban board.** Nice to have, but the list view with status filters covers the same need with less complexity.
3. **Email reminders for due dates.** Needs a scheduler and an email service; overdue highlights in the app cover the basic need.

## Limitation I would fix with one more day

**No pagination.** The API returns all of a user's tasks in one request. This is fine for a personal list, but it would get slow for a user with thousands of tasks. With one more day I would add page-based pagination to `GET /api/tasks` (with `page` and `limit`), show "Load more" in the UI, and add API tests (Jest + Supertest) to cover it.

## Author

Sejal Bhawsar · sejalbhawsar24@gmail.com