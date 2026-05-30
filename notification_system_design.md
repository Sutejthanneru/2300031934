# Vehicle Maintenance Scheduler

This folder contains the Stage 1 scheduler implementation for the vehicle maintenance exam.

## Purpose

- Fetch depot budget data from the provided API
- Fetch vehicle task data from the provided API
- Select the subset of tasks that maximizes total `Impact`
- Ensure total `Duration` stays within the depot's available `MechanicHours`

## Run

1. Install dependencies if needed:
   ```bash
   npm install
   ```

2. Run the scheduler:
   ```bash
   node vehicle_maintence_scheduler/scheduler.js
   ```

3. If the API requires authorization, set an environment variable:
   ```bash
   API_TOKEN=your_token node vehicle_maintence_scheduler/scheduler.js
   ```

## Output

The scheduler prints JSON showing:
- chosen depot
- selected task count
- total duration used
- total impact score
- selected task details
