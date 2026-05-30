import express from "express";
import {
  loggingMiddleware,
  getAllLogs,
  getLogsByLevel,
  getLogsByPackage,
  clearLogs,
} from "./logger.js";

const router = express.Router();

router.use(loggingMiddleware);

router.post("/logs", (req, res) => {
  const logEntry = req.log(req.body);

  if (logEntry && logEntry.id) {
    res.status(201).json({
      status: "success",
      log: logEntry,
    });
  }
});

router.get("/logs", getAllLogs);
router.get("/logs/level/:level", getLogsByLevel);
router.get("/logs/package/:pkg", getLogsByPackage);
router.delete("/logs", clearLogs);

export default router;
