# Taskly – Task Manager (MERN)

A simple, clean task manager where each user can sign up, log in and manage their own tasks.

**Live app:** _add your Netlify link here_
**API:** _add your Render link here_

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

## Known limitation

The backend runs on Render's free plan, which sleeps after inactivity, so the first request can take up to a minute (the app shows a "waking up" message). There are also no automated tests or pagination yet. With one more day I would add API tests (Jest + Supertest) and pagination for large task lists.
