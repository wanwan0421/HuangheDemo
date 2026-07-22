import type { Message, SimulationPlan } from "../types";
import { serializeSimulationPlan } from "./simulationPlan";

export const WORKBENCH_STORAGE_KEY = "geoagent_simulation_workbench";

export type WorkbenchStorage = Record<string, { plan: SimulationPlan; messages: Message[] }>;
export type WorkbenchHistoryItem = { key: string; plan: SimulationPlan; messages: Message[] };

export const getWorkbenchStorageKey = (activeChatId: string | null, planId: string) =>
  activeChatId || `local:${planId}`;

export const hasMeaningfulWorkbenchContent = (plan: SimulationPlan, messages: Message[]) => {
  const hasMessages = messages.some((message) => {
    const hasText = Boolean(message.content?.trim());
    const hasTools = Boolean(message.tools?.length);
    return hasText || hasTools;
  });
  const hasGoal = Boolean(
    plan.goal.objective.trim() ||
      plan.goal.studyArea.trim() ||
      plan.goal.timeHorizon.trim(),
  );
  const hasModel = Boolean(
    plan.model.recommendedName ||
      plan.model.description.trim() ||
      plan.model.workflow.length ||
      plan.model.alternatives.length,
  );
  const hasData = Boolean(plan.data.slots.length || Object.keys(plan.parameters.values).length);
  const hasResult = Boolean(plan.result.taskId || plan.result.raw || plan.result.outputs.length);

  return hasMessages || hasGoal || hasModel || hasData || hasResult;
};

export const loadWorkbenchStorage = (): WorkbenchStorage => {
  try {
    const raw = localStorage.getItem(WORKBENCH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveWorkbenchStorage = (storage: WorkbenchStorage) => {
  try {
    localStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Persist simulation workbench failed", error);
  }
};

export const removeWorkbenchSnapshot = (storageKey: string) => {
  const storage = loadWorkbenchStorage();
  if (!(storageKey in storage)) return;
  delete storage[storageKey];
  saveWorkbenchStorage(storage);
};

export const persistWorkbenchSnapshot = (
  storageKey: string,
  plan: SimulationPlan,
  messages: Message[],
) => {
  const storage = loadWorkbenchStorage();

  if (!hasMeaningfulWorkbenchContent(plan, messages)) {
    if (storageKey.startsWith("local:") && storage[storageKey]) {
      delete storage[storageKey];
      saveWorkbenchStorage(storage);
    }
    return;
  }

  storage[storageKey] = {
    plan: serializeSimulationPlan(plan),
    messages,
  };
  saveWorkbenchStorage(storage);
};

export const getWorkbenchHistoryItems = (): WorkbenchHistoryItem[] => {
  const storage = loadWorkbenchStorage();
  let didPrune = false;

  const items = Object.entries(storage)
    .map(([key, value]) => ({ key, ...value }))
    .filter((item) => {
      const keep =
        Boolean(item.plan?.id) &&
        hasMeaningfulWorkbenchContent(item.plan, item.messages || []);

      if (!keep && item.key.startsWith("local:")) {
        delete storage[item.key];
        didPrune = true;
      }

      return keep;
    })
    .sort((a, b) => {
      const bTime = new Date(b.plan.updatedAt || b.plan.createdAt).getTime();
      const aTime = new Date(a.plan.updatedAt || a.plan.createdAt).getTime();
      return bTime - aTime;
    });

  if (didPrune) {
    saveWorkbenchStorage(storage);
  }

  return items;
};
