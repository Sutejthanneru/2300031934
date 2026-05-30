// notification_app_be/server.js

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

const PORT =
  process.env.NOTIFICATION_PORT ||
  5001;

const server =
  http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "User disconnected"
    );
  });
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(
    `Notification backend running on port ${PORT}`
  );

  console.log(
    `Health Check: http://localhost:${PORT}/health`
  );

  console.log(
    `GET http://localhost:${PORT}/api/notifications`
  );

  console.log(
    `GET http://localhost:${PORT}/api/notifications/top`
  );

  console.log(
    `GET http://localhost:${PORT}/api/notifications/unread`
  );
});