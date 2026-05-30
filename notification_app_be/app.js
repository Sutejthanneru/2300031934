// notification_app_be/app.js

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { PriorityInbox } from "./priority-inbox.js";

const app = express();

app.use(express.json());

const notificationsStore = new Map();
const userNotifications = new Map();

const priorityInbox = new PriorityInbox();

function initializeMockData() {
  const mockNotifications = [
    {
      id: uuidv4(),
      userId: "user-123",
      type: "Placement",
      message:
        "Google placement drive tomorrow",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: uuidv4(),
      userId: "user-123",
      type: "Event",
      message:
        "Campus recruitment event",
      timestamp: new Date(
        Date.now() - 3600000
      ).toISOString(),
      read: false,
    },
    {
      id: uuidv4(),
      userId: "user-123",
      type: "Result",
      message:
        "Mid semester results published",
      timestamp: new Date(
        Date.now() - 7200000
      ).toISOString(),
      read: true,
    },
  ];

  mockNotifications.forEach((notif) => {
    notificationsStore.set(notif.id, notif);

    if (!userNotifications.has(notif.userId)) {
      userNotifications.set(
        notif.userId,
        []
      );
    }

    userNotifications
      .get(notif.userId)
      .push(notif.id);

    priorityInbox.addNotification(notif);
  });
}

initializeMockData();

app.use((req, res, next) => {
  req.userId =
    req.headers["x-user-id"] ||
    "user-123";

  next();
});

app.get(
  "/api/notifications",
  (req, res) => {
    const userIds =
      userNotifications.get(req.userId) || [];

    const notifications = userIds
      .map((id) =>
        notificationsStore.get(id)
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      );

    res.json({
      status: "success",
      notifications,
    });
  }
);

app.get(
  "/api/notifications/unread",
  (req, res) => {
    const userIds =
      userNotifications.get(req.userId) || [];

    const notifications = userIds
      .map((id) =>
        notificationsStore.get(id)
      )
      .filter((notif) => !notif.read)
      .sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      );

    res.json({
      status: "success",
      unreadCount:
        notifications.length,
      notifications,
    });
  }
);

app.get("/api/notifications/top", (req, res) => {
  const topNotifications =
    priorityInbox.getTopUnreadNotifications(
      req.userId,
      10
    );

  res.json({
    status: "success",
    count: topNotifications.length,
    notifications: topNotifications,
  });
});
app.post(
  "/api/notifications",
  (req, res) => {
    const {
      userId,
      type,
      message,
      metadata,
    } = req.body;

    if (
      !userId ||
      !type ||
      !message
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required fields",
      });
    }

    const validTypes = [
      "Placement",
      "Result",
      "Event",
      "Announcement",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid notification type",
      });
    }

    const newNotification = {
      id: uuidv4(),
      userId,
      type,
      message,
      metadata: metadata || {},
      timestamp:
        new Date().toISOString(),
      read: false,
    };

    notificationsStore.set(
      newNotification.id,
      newNotification
    );

    if (!userNotifications.has(userId)) {
      userNotifications.set(
        userId,
        []
      );
    }

    userNotifications
      .get(userId)
      .push(newNotification.id);

    priorityInbox.addNotification(
      newNotification
    );

    const io = req.app.get("io");

    if (io) {
      io.emit(
        "new-notification",
        newNotification
      );
    }

    res.status(201).json({
      status: "success",
      notification:
        newNotification,
    });
  }
);

app.patch(
  "/api/notifications/:id/read",
  (req, res) => {
    const { id } = req.params;

    const { read } = req.body;

    if (
      typeof read !== "boolean"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "read must be boolean",
      });
    }

    const notification =
      notificationsStore.get(id);

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message:
          "Notification not found",
      });
    }

    if (
      notification.userId !==
      req.userId
    ) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    notification.read = read;

    notificationsStore.set(
      id,
      notification
    );

    priorityInbox.markAsRead(
      req.userId,
      id
    );

    res.json({
      status: "success",
      notification,
    });
  }
);

app.delete(
  "/api/notifications/:id",
  (req, res) => {
    const { id } = req.params;

    const notification =
      notificationsStore.get(id);

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message:
          "Notification not found",
      });
    }

    if (
      notification.userId !==
      req.userId
    ) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    notificationsStore.delete(id);

    const userIds =
      userNotifications.get(
        req.userId
      ) || [];

    userNotifications.set(
      req.userId,
      userIds.filter(
        (uid) => uid !== id
      )
    );

    priorityInbox.deleteNotification(
      req.userId,
      id
    );

    res.json({
      status: "success",
      message:
        "Notification deleted",
    });
  }
);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service:
      "notification-backend",
  });
});

export default app;