import app from "./app.js";

const PORT = process.env.NOTIFICATION_PORT || 5001;

app.listen(PORT, () => {
  console.log(`Notification backend is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs:`);
  console.log(`  GET    http://localhost:${PORT}/api/notifications`);
  console.log(`  GET    http://localhost:${PORT}/api/notifications/unread`);
  console.log(`  POST   http://localhost:${PORT}/api/notifications`);
  console.log(`  PATCH  http://localhost:${PORT}/api/notifications/:id/read`);
  console.log(`  DELETE http://localhost:${PORT}/api/notifications/:id`);
});
