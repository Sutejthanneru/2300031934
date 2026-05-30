export class PriorityInbox {
  constructor() {
    this.notifications = new Map();
  }

  addNotification(notification) {
    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, []);
    }
    this.notifications.get(notification.userId).push(notification);
  }

  getTopNotifications(userId, n = 10) {
    const userNotifs = this.notifications.get(userId) || [];

    const sorted = userNotifs.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return sorted.slice(0, n);
  }

  getTopUnreadNotifications(userId, n = 10) {
    const userNotifs = this.notifications.get(userId) || [];

    const unread = userNotifs.filter((notif) => !notif.read);

    const sorted = unread.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return sorted.slice(0, n);
  }

  markAsRead(userId, notificationId) {
    const userNotifs = this.notifications.get(userId) || [];
    const notif = userNotifs.find((n) => n.id === notificationId);

    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  deleteNotification(userId, notificationId) {
    const userNotifs = this.notifications.get(userId) || [];
    const index = userNotifs.findIndex((n) => n.id === notificationId);

    if (index !== -1) {
      userNotifs.splice(index, 1);
      return true;
    }
    return false;
  }

  getNotificationStats(userId) {
    const userNotifs = this.notifications.get(userId) || [];
    const unreadCount = userNotifs.filter((n) => !n.read).length;
    const byPriority = {};

    userNotifs.forEach((notif) => {
      if (!byPriority[notif.priority]) {
        byPriority[notif.priority] = 0;
      }
      byPriority[notif.priority]++;
    });

    return {
      totalNotifications: userNotifs.length,
      unreadCount,
      byPriority,
    };
  }
}
