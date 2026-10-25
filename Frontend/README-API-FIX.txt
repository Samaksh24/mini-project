CivicFix responsive frontend — API connection fix

The Express backend in this project listens on http://localhost:3000.
Vite now proxies /api/* requests to that backend, so run the backend and frontend separately.

Run backend (in your existing backend folder):
  npm install   (only if this backend folder has no node_modules)
  npm start     (or the command you already use to start server.js)

Run frontend (in this Frontend folder):
  npm install
  npm run dev

Endpoint mapping used by src/lib/api.js:
  POST /api/auth/register             -> authRoutes.js /register
  POST /api/auth/login                -> authRoutes.js /login
  POST /api/auth/logout               -> authRoutes.js /logout
  GET  /api/complaints?category=...&status=... -> complaintRoutes.js /
  POST /api/complaints/submitcomplaint -> complaintRoutes.js /submitcomplaint
  PATCH /api/complaints/:id/status     -> complaintRoutes.js /:id/status
  GET  /api/complaints/mine            -> the authenticated getMyComplaints route you added

Note: GET /api/complaints/mine only works if you added getMyComplaints to the backend controller
and registered router.get('/mine', authMiddleware, getMyComplaints) in complaintRoutes.js.
Keep that route before any generic /:id route if you have one.

If your backend uses a different port, change target in vite.config.js.
Do not set VITE_API_URL when using this local proxy. For a deployed backend, set VITE_API_URL
including its /api prefix, for example https://your-host.example/api.
