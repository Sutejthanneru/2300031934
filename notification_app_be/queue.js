import { v4 as uuidv4 } from "uuid";

const notificationQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || notificationQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (notificationQueue.length > 0) {
    const task = notificationQueue.shift();

    try {
      await task();
      console.log(`[QUEUE] Task completed, ${notificationQueue.length} remaining`);
    } catch (error) {
      console.error(`[QUEUE] Task failed:`, error.message);
      notificationQueue.push(task);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  isProcessing = false;
}

export async function notifyAll(userIds, notificationData) {
  const { type, message, priority = 5, metadata = {} } = notificationData;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error("userIds must be a non-empty array");
  }

  if (!type || !message) {
    throw new Error("type and message are required");
  }

  const sendPromises = userIds.map((userId) => {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const notificationId = uuidv4();
          const notification = {
            id: notificationId,
            userId,
            type,
            message,
            priority,
            metadata,
            timestamp: new Date().toISOString(),
            read: false,
            deliveryStatus: "sent",
          };

          console.log(
            `[NOTIFY] Sent to ${userId}: ${message.substring(0, 50)}...`
          );

          resolve(notification);
        } catch (error) {
          reject(error);
        }
      };

      notificationQueue.push(task);
      processQueue();
    });
  });

  return Promise.all(sendPromises);
}

export function getQueueStatus() {
  return {
    queueLength: notificationQueue.length,
    isProcessing,
    timestamp: new Date().toISOString(),
  };
}

export async function flushQueue() {
  while (notificationQueue.length > 0 || isProcessing) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log("[QUEUE] All tasks completed");
}
