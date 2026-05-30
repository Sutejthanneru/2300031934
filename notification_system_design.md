# Notification System Design

Complete design documentation for the notification platform across all stages.

## Stage 1 — Notification API design

### Core actions the platform should support
- Fetch user notifications
- Mark a notification as read
- Send a new notification
- Fetch unread notification count
- Subscribe to real-time notification updates

### API endpoints

#### `GET /api/notifications`
Fetch all notifications for the authenticated user.

Request headers:
- `Authorization: Bearer <token>`
- `Accept: application/json`

Response example:
```json
{
  "status": "success",
  "notifications": [
    {
      "id": "abc123",
      "type": "Placement",
      "message": "New placement drive scheduled",
      "timestamp": "2026-04-22T17:51:18Z",
      "read": false,
      "priority": 10
    }
  ]
}
```

#### `GET /api/notifications/unread`
Fetch only unread notifications or unread count.

Response example:
```json
{
  "status": "success",
  "unreadCount": 5,
  "notifications": [ ... ]
}
```

#### `POST /api/notifications`
Create or send a notification.

Request body example:
```json
{
  "userId": "user-123",
  "type": "Result",
  "message": "Your exam result is available",
  "metadata": { "examId": "exam-456" }
}
```

Response example:
```json
{
  "status": "success",
  "notification": {
    "id": "def456",
    "status": "created"
  }
}
```

#### `PATCH /api/notifications/:id/read`
Mark a notification as read.

Request body example:
```json
{
  "read": true
}
```

Response example:
```json
{
  "status": "success",
  "notification": {
    "id": "abc123",
    "read": true
  }
}
```

#### `DELETE /api/notifications/:id`
Delete a notification.

Response example:
```json
{
  "status": "success",
  "message": "Notification deleted"
}
```

### Real-time notification mechanism
- Use WebSockets or Server-Sent Events (SSE) to push notifications to logged-in clients.
- Clients subscribe after login using a token.
- The server sends new notifications immediately when they arrive.

Example WebSocket connection:
```
wss://example.com/api/notifications/stream
Authorization: Bearer <token>
```

## Stage 2 — Storage and schema

### Recommended storage
- Use a relational database such as PostgreSQL for notifications.
- Rationale: notifications are structured, need indexing, and must support user-level queries.

### Schema example

#### `users`
- `id` UUID
- `name` TEXT
- `email` TEXT

#### `notifications`
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES users(id)
- `type` TEXT
- `message` TEXT
- `priority` INTEGER
- `timestamp` TIMESTAMP WITH TIME ZONE
- `read` BOOLEAN DEFAULT false
- `metadata` JSONB

### Query examples

Fetch unread top-priority notifications:
```sql
SELECT id, type, message, priority, timestamp
FROM notifications
WHERE user_id = $1 AND read = false
ORDER BY priority DESC, timestamp DESC
LIMIT $2;
```

Mark notification read:
```sql
UPDATE notifications
SET read = true
WHERE id = $1 AND user_id = $2;
```

### Scaling considerations
- Add indexes on `user_id`, `read`, and `priority`
- Use pagination for notification lists
- Use a cache or Redis for high-read notification counts
- Separate write path from real-time delivery using a message queue if volume grows

## Stage 3 — Notification Backend Implementation

### Implementation details

The notification backend is implemented in `notification_app_be/` using Node.js and Express.

#### Running the backend
```bash
npm install uuid
npm run notification-backend
```

Server runs on port `5001` (configurable via `NOTIFICATION_PORT` environment variable).

#### Key features

1. **In-memory storage**: Uses JavaScript Map for notifications and user-to-notifications mapping
2. **Mock authentication**: Extracts userId from `x-user-id` request header
3. **Data initialization**: Loads sample notifications on startup
4. **Full CRUD operations**: Create, read, update (mark read), delete notifications

#### Endpoint implementation

All endpoints return consistent JSON response structure:
```json
{
  "status": "success|error",
  "data": { ... }
}
```

Error responses include error messages:
```json
{
  "status": "error",
  "message": "Error description"
}
```

#### Notification types
- Placement
- Event
- Result
- Announcement

#### Priority
- Default: 5
- Range: 1-10 (higher is more important)

#### Health check
- Endpoint: `GET /health`
- Returns: `{ "status": "ok", "service": "notification-backend" }`

#### Request headers
- `x-user-id`: User identifier (defaults to "user-123")
- `Content-Type`: application/json

### File structure
- `notification_app_be/app.js` — Express app setup and all route handlers
- `notification_app_be/server.js` — Server initialization and startup

### Example curl requests

Get all notifications:
```bash
curl -H "x-user-id: user-123" http://localhost:5001/api/notifications
```

Get unread notifications:
```bash
curl -H "x-user-id: user-123" http://localhost:5001/api/notifications/unread
```

Create notification:
```bash
curl -X POST http://localhost:5001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "type": "Placement", "message": "New opportunity", "priority": 10}'
```

Mark as read:
```bash
curl -X PATCH http://localhost:5001/api/notifications/notification-id/read \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

Delete notification:
```bash
curl -X DELETE http://localhost:5001/api/notifications/notification-id
```

## Stage 4 — Logging Middleware

### Implementation details

The logging middleware is implemented in `logging_middleware/` using Node.js and provides structured logging with validation.

#### Running the middleware

The middleware is used by importing it into any Express application:

```javascript
import loggingRouter from "./logging_middleware/routes.js";
app.use("/api", loggingRouter);
```

#### Valid values

**Stack (required, lowercase only):**
- `backend`
- `frontend`

**Level (required, lowercase only):**
- `debug`
- `info`
- `warn`
- `error`
- `fatal`

**Package (required, lowercase only):**
- Backend packages: `handler`, `repository`, `route`, `service`, `middleware`, `controller`, `cache`, `cron_job`, `db`, `domain`
- Frontend packages: `api`, `component`, `hook`, `page`, `state`, `style`
- Shared packages: `auth`, `config`, `utils`

**Message (required):**
- String message describing the log entry

#### Log entry structure

```json
{
  "id": "1234567890-abc123",
  "timestamp": "2026-04-22T17:51:18.000Z",
  "stack": "backend",
  "level": "error",
  "package": "handler",
  "message": "received string, expected bool"
}
```

#### API endpoints

**POST /logs**
Create a new log entry.

Request body:
```json
{
  "stack": "backend",
  "level": "error",
  "package": "handler",
  "message": "error description here"
}
```

Response:
```json
{
  "status": "success",
  "log": {
    "id": "1234567890-abc123",
    "timestamp": "2026-04-22T17:51:18.000Z",
    "stack": "backend",
    "level": "error",
    "package": "handler",
    "message": "error description here"
  }
}
```

**GET /logs**
Fetch all logs.

Response:
```json
{
  "status": "success",
  "totalLogs": 42,
  "logs": [...]
}
```

**GET /logs/level/:level**
Fetch logs by level (debug, info, warn, error, fatal).

Example: `GET /logs/level/error`

Response:
```json
{
  "status": "success",
  "level": "error",
  "count": 5,
  "logs": [...]
}
```

**GET /logs/package/:pkg**
Fetch logs by package name.

Example: `GET /logs/package/handler`

Response:
```json
{
  "status": "success",
  "package": "handler",
  "count": 3,
  "logs": [...]
}
```

**DELETE /logs**
Clear all logs.

Response:
```json
{
  "status": "success",
  "message": "All logs cleared"
}
```

#### File structure
- `logging_middleware/logger.js` — Core logging functions and middleware
- `logging_middleware/routes.js` — Express routes for logging API

#### Validation errors

Invalid requests return 400 status with error details:

```json
{
  "status": "error",
  "message": "Invalid log request",
  "errors": [
    "stack must be one of: backend, frontend",
    "level must be one of: debug, info, warn, error, fatal"
  ]
}
```

#### Storage

Logs are persisted to `logging_middleware/logs.json` as a JSON array. The file is created automatically on first log entry.

#### Example curl requests

Create a log:
```bash
curl -X POST http://localhost:5001/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "stack": "backend",
    "level": "error",
    "package": "handler",
    "message": "received string, expected bool"
  }'
```

Get all logs:
```bash
curl http://localhost:5001/api/logs
```

Get error-level logs:
```bash
curl http://localhost:5001/api/logs/level/error
```

Get handler package logs:
```bash
curl http://localhost:5001/api/logs/package/handler
```

Clear all logs:
```bash
curl -X DELETE http://localhost:5001/api/logs
```

## Notes

- Each stage is implemented independently
- Stages 1 and 2 are design and schema documentation
- Stage 3 is a working Node.js implementation with in-memory storage
- Stage 4 is logging middleware with file-based persistence
- For production, replace file storage with a logging service (ELK, Datadog, etc.)
- Real-time WebSocket/SSE not yet implemented in Stage 3

