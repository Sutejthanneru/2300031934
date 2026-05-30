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

## Stage 4 — Performance Optimization

### Problem

Database is overwhelmed by fetching all notifications on every page load for 50,000 students with 5,000,000 total notifications.

### Performance Optimization Strategies

#### Strategy 1: In-Memory Caching

**Approach:** Cache user's recent notifications in memory (Redis or Node.js Map)

**Tradeoffs:**
- ✅ Pros: Extremely fast (microsecond latency), reduces DB queries by 80%+
- ❌ Cons: Memory overhead, staleness issues, cache invalidation complexity

**Implementation:**
```javascript
const notificationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getNotificationsFromCache(userId) {
  const cached = notificationCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function cacheNotifications(userId, notifications) {
  notificationCache.set(userId, {
    data: notifications,
    timestamp: Date.now(),
  });
}
```

#### Strategy 2: Pagination/Lazy Loading

**Approach:** Load only 20-50 notifications per page, user scrolls for more

**Tradeoffs:**
- ✅ Pros: Reduces payload size, faster page load, better UX
- ❌ Cons: User must scroll to see older notifications, multiple DB queries

**Implementation:**
```javascript
GET /api/notifications?page=1&limit=20

Response:
{
  "status": "success",
  "page": 1,
  "limit": 20,
  "total": 342,
  "hasMore": true,
  "notifications": [...]
}
```

#### Strategy 3: Database Indexing

**Approach:** Add indexes on frequently queried columns

**Tradeoffs:**
- ✅ Pros: Query speed improves 10-50x, especially for WHERE/ORDER BY
- ❌ Cons: Slower writes, increased storage

**Indexes to add:**
```sql
CREATE INDEX idx_user_timestamp ON notifications(userId, timestamp DESC);
CREATE INDEX idx_user_read ON notifications(userId, read);
CREATE INDEX idx_notification_type ON notifications(notificationType);
CREATE INDEX idx_created_date ON notifications(createdAt);
```

#### Strategy 4: Denormalization with Aggregation

**Approach:** Store summary of unread count separately

**Tradeoffs:**
- ✅ Pros: Unread count queries execute in microseconds
- ❌ Cons: Extra write overhead, data consistency issues

**Implementation:**
```sql
CREATE TABLE user_notification_counts (
  userId VARCHAR(50) PRIMARY KEY,
  unreadCount INT DEFAULT 0,
  totalCount INT DEFAULT 0,
  lastFetch TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update after marking notification as read:
UPDATE user_notification_counts 
SET unreadCount = unreadCount - 1 
WHERE userId = ?;
```

#### Strategy 5: Message Queue / Background Processing

**Approach:** Async queue to batch-fetch and pre-cache notifications

**Tradeoffs:**
- ✅ Pros: Reduces real-time DB load, enables pre-warming cache
- ❌ Cons: Complexity, slight delay, infrastructure overhead

### Recommended Combined Approach

1. **Add indexes** on (userId, timestamp DESC) and (userId, read) — Low cost, high impact
2. **Implement 5-minute TTL cache** with Redis for user's unread notifications
3. **Use pagination** — Load 20 notifications initially, lazy-load more
4. **Background refresh** — Refresh cache every 4 minutes via background job
5. **Denormalize unread count** — Separate table for quick badge updates

**Expected Result:** 
- Page load time: 5s → 100ms (50x faster)
- DB queries: 50,000/minute → 5,000/minute (90% reduction)
- Memory usage: +2GB for Redis cache (acceptable for 50k users)

## Stage 5 — Reliable Bulk Notification (notify_all)

### Implementation details

The bulk notification system uses async queue processing for reliability and speed when notifying large numbers of users (50,000+).

#### Queue-based architecture

Implemented in `notification_app_be/queue.js`:

- Maintains an async queue of notification tasks
- Processes one task at a time to prevent system overload
- Automatically retries failed tasks with exponential backoff
- Non-blocking - returns immediately with promise array

#### notify_all function

```javascript
notifyAll(userIds, notificationData)
```

**Parameters:**
- `userIds` — Array of user IDs to notify (required, non-empty)
- `notificationData` — Object with:
  - `type` — Notification type (Placement, Event, Result, Announcement)
  - `message` — Notification message text
  - `priority` — Priority level (1-10, default 5)
  - `metadata` — Additional data (optional)

**Returns:** Promise array of sent notification objects

#### Queue status monitoring

```javascript
getQueueStatus()
```

Returns:
```json
{
  "queueLength": 1250,
  "isProcessing": true,
  "timestamp": "2026-04-22T17:51:18.000Z"
}
```

#### Queue flushing

```javascript
flushQueue()
```

Waits for all queued tasks to complete before resolving.

#### Example usage

```javascript
import { notifyAll, getQueueStatus, flushQueue } from "./notification_app_be/queue.js";

const userIds = ["user-1", "user-2", "user-3", /* ...50000 users */];

notifyAll(userIds, {
  type: "Announcement",
  message: "System maintenance scheduled",
  priority: 8,
  metadata: { startTime: "2026-04-25T00:00:00Z" },
}).then(() => console.log("All notifications queued"));

const status = getQueueStatus();
console.log(`Queue status: ${status.queueLength} pending`);

await flushQueue();
console.log("All notifications delivered");
```

---

## Stage 6 — Priority Inbox / Top-N Notifications

### Implementation details

The priority inbox provides intelligent sorting and filtering of notifications based on priority level and recency for fast retrieval of most important messages.

#### PriorityInbox class

Implemented in `notification_app_be/priority-inbox.js`:

- Organizes notifications by user
- Sorts by priority (descending) then timestamp (newest first)
- Supports filtering by read/unread status
- Returns top-N notifications efficiently

#### Core methods

**getTopNotifications(userId, n)**
- Returns top N notifications for a user
- Sorted by priority (high to low), then by recency
- Default: n = 10

**getTopUnreadNotifications(userId, n)**
- Returns top N unread notifications
- Same sorting as above
- Useful for inbox displays

**getNotificationStats(userId)**
- Returns aggregate statistics:
  - Total notification count
  - Unread count
  - Distribution by priority level

**markAsRead(userId, notificationId)**
- Marks notification as read
- Returns true if successful

**deleteNotification(userId, notificationId)**
- Removes notification from inbox
- Returns true if successful

#### Sorting algorithm

1. Primary sort: `priority` (descending, 10 highest)
2. Secondary sort: `timestamp` (newest first, ISO 8601 format)

This ensures critical messages appear first regardless of when older high-priority messages arrived.

#### Response format

```json
{
  "status": "success",
  "userId": "user-123",
  "topN": 10,
  "count": 8,
  "notifications": [
    {
      "id": "notif-1",
      "userId": "user-123",
      "type": "Announcement",
      "message": "Critical security update",
      "priority": 9,
      "timestamp": "2026-04-22T17:51:18.000Z",
      "read": false,
      "metadata": {}
    },
    {
      "id": "notif-2",
      "userId": "user-123",
      "type": "Event",
      "message": "Placement drive tomorrow",
      "priority": 8,
      "timestamp": "2026-04-22T16:30:00.000Z",
      "read": false,
      "metadata": {}
    }
  ]
}
```

#### Example usage

```javascript
import { PriorityInbox } from "./notification_app_be/priority-inbox.js";

const inbox = new PriorityInbox();

inbox.addNotification({
  id: "notif-1",
  userId: "user-123",
  type: "Announcement",
  message: "Critical alert",
  priority: 9,
  timestamp: new Date().toISOString(),
  read: false,
});

const topNotifications = inbox.getTopNotifications("user-123", 5);
console.log(`Top 5 notifications:`, topNotifications);

const unreadTop = inbox.getTopUnreadNotifications("user-123", 10);
console.log(`Top 10 unread:`, unreadTop);

const stats = inbox.getNotificationStats("user-123");
console.log(`Stats:`, stats);
```

#### Performance considerations

- O(n log n) sort on retrieval (n = total notifications for user)
- O(1) add/mark/delete operations
- For production with millions of notifications, use indexed database (PostgreSQL with priority + timestamp index)

---

## Notes

- Each stage is implemented independently
- Stages 1 and 2 are design and schema documentation
- Stage 3 is query optimization analysis
- Stage 4 is performance optimization strategy (caching, indexing, pagination)
- Stage 5 is notify_all() with async queuing implementation
- Stage 6 is priority inbox with top-N filtering implementation
- For production: Use Redis for caching (Stage 4), PostgreSQL for storage, message queue for bulk operations (Stage 5)

