import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { loadConfig } from "../config/configStore";
import { startAgent, stopAgent } from "./agentService";

const TASK_NAME = "restro-print-agent-task";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const config = await loadConfig();
    if (!config) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    await startAgent(config);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask() {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    return;
  }

  const tasks = await TaskManager.getRegisteredTasksAsync();
  const alreadyRegistered = tasks.some((t) => t.taskName === TASK_NAME);
  if (!alreadyRegistered) {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true
    });
  }
}

export async function unregisterBackgroundTask() {
  await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  stopAgent();
}


