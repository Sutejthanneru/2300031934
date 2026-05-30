import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://4.224.186.213/evaluation-service";
const API_TOKEN = process.env.API_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
};
if (API_TOKEN) {
  headers.Authorization = `Bearer ${API_TOKEN}`;
}

async function fetchJson(path) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}. ` +
          "This route appears protected. Set API_TOKEN in .env or environment variables."
      );
    }
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function solveKnapsack(tasks, capacity) {
  const n = tasks.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
  const keep = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(false));

  for (let i = 1; i <= n; i += 1) {
    const { Duration, Impact } = tasks[i - 1];
    for (let w = 0; w <= capacity; w += 1) {
      if (Duration <= w) {
        const withTask = Impact + dp[i - 1][w - Duration];
        if (withTask > dp[i - 1][w]) {
          dp[i][w] = withTask;
          keep[i][w] = true;
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  let w = capacity;
  const selected = [];
  for (let i = n; i > 0; i -= 1) {
    if (keep[i][w]) {
      const task = tasks[i - 1];
      selected.push(task);
      w -= task.Duration;
    }
  }

  selected.reverse();
  const totalDuration = selected.reduce((sum, task) => sum + task.Duration, 0);
  const totalImpact = selected.reduce((sum, task) => sum + task.Impact, 0);

  return { selected, totalDuration, totalImpact };
}

async function main() {
  console.log("Starting vehicle maintenance scheduler...");
  const depotsResponse = await fetchJson("/depots");
  const vehiclesResponse = await fetchJson("/vehicles");

  const depots = depotsResponse.depots || [];
  const vehicles = vehiclesResponse.vehicles || [];

  if (!Array.isArray(depots) || depots.length === 0) {
    throw new Error("No depots returned from API");
  }
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    throw new Error("No vehicle tasks returned from API");
  }

  const depot = depots.reduce((best, current) => {
    return current.MechanicHours > best.MechanicHours ? current : best;
  }, depots[0]);

  console.log(`Using depot ID ${depot.ID} with ${depot.MechanicHours} mechanic hours`);

  const { selected, totalDuration, totalImpact } = solveKnapsack(vehicles, depot.MechanicHours);

  const result = {
    depot,
    selectedCount: selected.length,
    totalDuration,
    totalImpact,
    selectedTasks: selected.map((task) => ({ TaskID: task.TaskID, Duration: task.Duration, Impact: task.Impact })),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Scheduler failed:", error.message);
  process.exit(1);
});
