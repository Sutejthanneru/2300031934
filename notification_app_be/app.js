import express from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const notificationsStore = new Map();
const userNotifications = new Map();


function initializeMockData() {
  const mockNotifications = [
    {
      id: uuidv4(),
      userId: "user-123",
      type: "Placement",
      message: "New placement drive scheduled for tomorrow",
      timestamp: new Date().toISOString(),
      read: false,
      priority: 10,
    },
    {
      id: uuidv4(),
      userId: "user-123",
      type: "Event",
      message: "Campus recruitment event",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      priority: 8,
    },
    {
      id: uuidv4(),
      userId: "user-123",
      type: "Result",
      message: "Mid-semester exam results published",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      priority: 7,
    },
  ];

  mockNotifications.forEach((notif) => {
    notificationsStore.set(notif.id, notif);
    if (!userNotifications.has(notif.userId)) {
      userNotifications.set(notif.userId, []);
    }
    userNotifications.get(notif.userId).push(notif.id);
  });
}

initializeMockData();


app.use((req, res, next) => {
  req.userId = req.headers["x-user-id"] || "user-123";
  next();
});

app.get("/api/notifications", (req, res) => {
  const userIds = userNotifications.get(req.userId) || [];
  const notifications = userIds.map((id) => notificationsStore.get(id));

  res.json({
    status: "success",
    notifications: notifications.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    ),
  });
});

app.get("/api/notifications/unread", (req, res) => {
  const userIds = userNotifications.get(req.userId) || [];
  const notifications = userIds
    .map((id) => notificationsStore.get(id))
    .filter((notif) => !notif.read);

  res.json({
    status: "success",
    unreadCount: notifications.length,
    notifications: notifications.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    ),
  });
});

app.post("/api/notifications", (req, res) => {
  const { userId, type, message, priority = 5, metadata } = req.body;

  if (!userId || !type || !message) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: userId, type, message",
    });
  }

  if (!["Placement", "Event", "Result", "Announcement"].includes(type)) {
    return res.status(400).json({
      status: "error",
      message:
        "Invalid type. Must be one of: Placement, Event, Result, Announcement",
    });
  }

  const newNotification = {
    id: uuidv4(),
    userId,
    type,
    message,
    priority,
    metadata: metadata || {},
    timestamp: new Date().toISOString(),
    read: false,
  };

  notificationsStore.set(newNotification.id, newNotification);
  if (!userNotifications.has(userId)) {
    userNotifications.set(userId, []);
  }
  userNotifications.get(userId).push(newNotification.id);

  res.status(201).json({
    status: "success",
    notification: newNotification,
  });
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const { read } = req.body;

  if (typeof read !== "boolean") {
    return res.status(400).json({
      status: "error",
      message: "read field must be a boolean",
    });
  }

  const notification = notificationsStore.get(id);
  if (!notification) {
    return res.status(404).json({
      status: "error",
      message: "Notification not found",
    });
  }

  if (notification.userId !== req.userId) {
    return res.status(403).json({
      status: "error",
      message: "Unauthorized access",
    });
  }

  notification.read = read;
  notificationsStore.set(id, notification);

  res.json({
    status: "success",
    notification,
  });
});

app.delete("/api/notifications/:id", (req, res) => {
  const { id } = req.params;

  const notification = notificationsStore.get(id);
  if (!notification) {
    return res.status(404).json({
      status: "error",
      message: "Notification not found",
    });
  }

  if (notification.userId !== req.userId) {
    return res.status(403).json({
      status: "error",
      message: "Unauthorized access",
    });
  }

  notificationsStore.delete(id);
  const userIds = userNotifications.get(req.userId);
  if (userIds) {
    userNotifications.set(
      req.userId,
      userIds.filter((uid) => uid !== id)
    );
  }

  res.json({
    status: "success",
    message: "Notification deleted",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-backend" });
});

export default app;
