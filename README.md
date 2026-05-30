# Smart Notification & Vehicle Scheduling System

A scalable backend system built using **Node.js**, **Express.js**, and **Socket.IO** that provides:

- Priority-based notification management
- Real-time notification delivery
- RESTful APIs
- Vehicle maintenance scheduling optimization using Knapsack Algorithm
- System design and scalability considerations

---

# Tech Stack

- Node.js
- Express.js
- Socket.IO
- UUID
- JavaScript (ES Modules)

---

# Project Structure

```bash
project-root/
│
├── notification_app_be/
│   ├── app.js
│   ├── server.js
│   ├── priority-inbox.js
│
├── vehicle_scheduling/
│   ├── scheduler.js
│   ├── output1.png
│   ├── output2.png
│   ├── output3.png
│
├── notification_system_design.md
├── package.json
├── README.md
```

---

# Features

## Notification System

- Create notifications
- Get all notifications
- Get unread notifications
- Get top priority notifications
- Mark notifications as read
- Delete notifications
- Real-time notifications using Socket.IO
- Dynamic priority ranking

---

## Vehicle Scheduling System

- Fetch depot and vehicle data
- Select best depot
- Optimize vehicle maintenance scheduling
- Uses Dynamic Programming (Knapsack Algorithm)
- Maximizes impact within mechanic hour constraints

---

# Installation

## Clone Repository

```bash
git clone <your-github-repo-url>
```

---

## Install Dependencies

```bash
npm install
```

---

# Run Backend Server

```bash
npm start
```

---

# Expected Terminal Output

```bash
Notification backend running on port 5001

GET http://localhost:5001/api/notifications

GET http://localhost:5001/api/notifications/top

GET http://localhost:5001/api/notifications/unread
```

---

# Base URL

```bash
http://localhost:5001
```

---

# API Documentation

# 1. Health Check API

## Endpoint

```http
GET /health
```

## Full URL

```bash
http://localhost:5001/health
```

## Response

```json
{
  "status": "ok",
  "service": "notification-backend"
}
```

---

# 2. Get All Notifications

## Endpoint

```http
GET /api/notifications
```

## Full URL

```bash
http://localhost:5001/api/notifications
```

## Response

```json
{
  "status": "success",
  "notifications": [
    {
      "id": "123",
      "type": "Placement",
      "message": "Google placement drive tomorrow",
      "read": false
    }
  ]
}
```

---

# 3. Get Unread Notifications

## Endpoint

```http
GET /api/notifications/unread
```

## Full URL

```bash
http://localhost:5001/api/notifications/unread
```

## Response

```json
{
  "status": "success",
  "unreadCount": 2,
  "notifications": []
}
```

---

# 4. Get Top Priority Notifications

## Endpoint

```http
GET /api/notifications/top
```

## Full URL

```bash
http://localhost:5001/api/notifications/top
```

## Response

```json
{
  "status": "success",
  "count": 2,
  "notifications": [
    {
      "type": "Placement",
      "message": "Google placement drive tomorrow",
      "priorityScore": 149.9
    }
  ]
}
```

---

# 5. Create Notification

## Endpoint

```http
POST /api/notifications
```

## Full URL

```bash
http://localhost:5001/api/notifications
```

## Request Body

```json
{
  "userId": "user-123",
  "type": "Placement",
  "message": "Amazon placement drive tomorrow"
}
```

## Response

```json
{
  "status": "success",
  "notification": {
    "id": "12345",
    "type": "Placement",
    "message": "Amazon placement drive tomorrow"
  }
}
```

---

# 6. Mark Notification As Read

## Endpoint

```http
PATCH /api/notifications/:id/read
```

## Example

```bash
http://localhost:5001/api/notifications/123/read
```

## Request Body

```json
{
  "read": true
}
```

## Response

```json
{
  "status": "success",
  "notification": {
    "read": true
  }
}
```

---

# 7. Delete Notification

## Endpoint

```http
DELETE /api/notifications/:id
```

## Example

```bash
http://localhost:5001/api/notifications/123
```

## Response

```json
{
  "status": "success",
  "message": "Notification deleted"
}
```

---

# Dynamic Priority System

Notifications are ranked dynamically based on:

- Notification type
- Recency

## Priority Order

| Type | Weight |
|---|---|
| Placement | 100 |
| Result | 80 |
| Event | 60 |
| Announcement | 40 |

---

# Real-Time Notifications

Socket.IO is integrated for real-time notification delivery.

When a new notification is created:
- backend emits WebSocket event
- connected users receive updates instantly

---

# Vehicle Scheduling Algorithm

The vehicle scheduling module uses:

## Dynamic Programming

Specifically:
- 0/1 Knapsack Algorithm

---

# Goal

Maximize total maintenance impact while staying within available mechanic hours.

---

# Scheduling Logic

## Inputs

- Vehicle maintenance tasks
- Mechanic hour capacity

## Output

- Optimal set of maintenance tasks
- Maximum total impact

---

# Complexity

| Operation | Complexity |
|---|---|
| Knapsack DP | O(n × capacity) |
| Top Notifications | O(n log n) |

---

# Scalability Improvements

Future improvements:

- Redis caching
- Kafka/RabbitMQ queues
- PostgreSQL integration
- Docker deployment
- Kubernetes scaling
- JWT Authentication
- MongoDB/PostgreSQL persistence

---

# Output Screenshots

## Vehicle Scheduling Outputs

Images are available inside:

```bash
vehicle_scheduling/
```

Example:

```bash
vehicle_scheduling/output1.png
vehicle_scheduling/output2.png
vehicle_scheduling/output3.png
```

---

# System Design Highlights

- RESTful API architecture
- Real-time communication
- Dynamic ranking system
- Scalable notification handling
- Efficient scheduling optimization
- Queue-based architecture support

---

# Author

Sutej Tanneru

---

# Submission Notes

This project was developed as part of a backend/system design evaluation focusing on:

- API development
- Priority inbox systems
- Real-time notification delivery
- Scalable backend architecture
- Optimization algorithms
- System design reasoning
