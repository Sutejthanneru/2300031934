import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = [
  "handler",
  "repository",
  "route",
  "service",
  "middleware",
  "controller",
  "cache",
  "cron_job",
  "db",
  "domain",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "utils",
];

const logsFile = path.join(__dirname, "logs.json");

function initializeLogsFile() {
  if (!fs.existsSync(logsFile)) {
    fs.writeFileSync(logsFile, JSON.stringify({ logs: [] }, null, 2));
  }
}

function readLogs() {
  try {
    const data = fs.readFileSync(logsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return { logs: [] };
  }
}

function writeLogs(data) {
  fs.writeFileSync(logsFile, JSON.stringify(data, null, 2));
}

function validateLogRequest(body) {
  const { stack, level, package: pkg, message } = body;

  const errors = [];

  if (!stack) {
    errors.push("stack is required");
  } else if (!VALID_STACKS.includes(stack)) {
    errors.push(`stack must be one of: ${VALID_STACKS.join(", ")}`);
  }

  if (!level) {
    errors.push("level is required");
  } else if (!VALID_LEVELS.includes(level)) {
    errors.push(`level must be one of: ${VALID_LEVELS.join(", ")}`);
  }

  if (!pkg) {
    errors.push("package is required");
  } else if (!VALID_PACKAGES.includes(pkg)) {
    errors.push(`package must be one of: ${VALID_PACKAGES.join(", ")}`);
  }

  if (!message) {
    errors.push("message is required");
  } else if (typeof message !== "string") {
    errors.push("message must be a string");
  }

  return { valid: errors.length === 0, errors };
}

export function loggingMiddleware(req, res, next) {
  initializeLogsFile();

  req.log = function (logData) {
    const validation = validateLogRequest(logData);

    if (!validation.valid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid log request",
        errors: validation.errors,
      });
    }

    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      stack: logData.stack,
      level: logData.level,
      package: logData.package,
      message: logData.message,
    };

    const logsData = readLogs();
    logsData.logs.push(logEntry);
    writeLogs(logsData);

    console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.message}`);

    return logEntry;
  };

  next();
}

export function getAllLogs(req, res) {
  initializeLogsFile();
  const logsData = readLogs();
  res.json({
    status: "success",
    totalLogs: logsData.logs.length,
    logs: logsData.logs,
  });
}

export function getLogsByLevel(req, res) {
  const { level } = req.params;

  if (!VALID_LEVELS.includes(level)) {
    return res.status(400).json({
      status: "error",
      message: `Invalid level. Must be one of: ${VALID_LEVELS.join(", ")}`,
    });
  }

  initializeLogsFile();
  const logsData = readLogs();
  const filtered = logsData.logs.filter((log) => log.level === level);

  res.json({
    status: "success",
    level,
    count: filtered.length,
    logs: filtered,
  });
}

export function getLogsByPackage(req, res) {
  const { pkg } = req.params;

  if (!VALID_PACKAGES.includes(pkg)) {
    return res.status(400).json({
      status: "error",
      message: `Invalid package. Must be one of: ${VALID_PACKAGES.join(", ")}`,
    });
  }

  initializeLogsFile();
  const logsData = readLogs();
  const filtered = logsData.logs.filter((log) => log.package === pkg);

  res.json({
    status: "success",
    package: pkg,
    count: filtered.length,
    logs: filtered,
  });
}

export function clearLogs(req, res) {
  writeLogs({ logs: [] });
  res.json({
    status: "success",
    message: "All logs cleared",
  });
}
