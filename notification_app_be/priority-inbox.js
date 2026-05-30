export class PriorityInbox {
  constructor() {
    this.notifications = new Map();

    this.typeWeights = {
      Placement: 100,
      Result: 80,
      Event: 60,
      Announcement: 40,
    };
  }

  calculatePriority(notification) {
    const baseWeight =
      this.typeWeights[notification.type] || 10;

    const ageInHours =
      (Date.now() -
        new Date(notification.timestamp).getTime()) /
      (1000 * 60 * 60);

    const recencyScore = Math.max(0, 50 - ageInHours);

    return baseWeight + recencyScore;
  }

  addNotification(notification) {
    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, []);
    }

    notification.priorityScore =
      this.calculatePriority(notification);

    this.notifications
      .get(notification.userId)
      .push(notification);
  }

  getTopNotifications(userId, n = 10) {
    const userNotifs =
      this.notifications.get(userId) || [];

    return [...userNotifs]
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore
      )
      .slice(0, n);
  }

  getTopUnreadNotifications(userId, n = 10) {
    const userNotifs =
      this.notifications.get(userId) || [];

    return [...userNotifs]
      .filter((notif) => !notif.read)
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore
      )
      .slice(0, n);
  }

  markAsRead(userId, notificationId) {
    const userNotifs =
      this.notifications.get(userId) || [];

    const notif = userNotifs.find(
      (n) => n.id === notificationId
    );

    if (notif) {
      notif.read = true;
      return true;
    }

    return false;
  }

  deleteNotification(userId, notificationId) {
    const userNotifs =
      this.notifications.get(userId) || [];

    const index = userNotifs.findIndex(
      (n) => n.id === notificationId
    );

    if (index !== -1) {
      userNotifs.splice(index, 1);
      return true;
    }

    return false;
  }
}