import type { SimulationPlan } from "../types";
import type { WorkbenchSectionId } from "./workbenchReducer";

export type FlowHealth = "empty" | "draft" | "ready" | "running" | "done" | "error";

export const getFlowHealth = (
  plan: SimulationPlan,
  runtimeFiles: Record<string, File>,
): Record<WorkbenchSectionId, FlowHealth> => {
  const hasDataDefinition =
    plan.data.slots.length > 0 || Object.keys(plan.parameters.values).length > 0;
  const dataReady =
    hasDataDefinition &&
    plan.data.slots.every((slot) => {
      if (!slot.required) return true;
      if (slot.kind === "file") return Boolean(runtimeFiles[slot.id] || runtimeFiles[slot.name]);
      return slot.value !== null && slot.value !== "";
    }) &&
    Object.values(plan.parameters.values).every((value) => value !== null && value !== "");

  return {
    goal: plan.goal.objective ? "ready" : "empty",
    model: plan.model.recommendedName ? "ready" : plan.model.workflow.length > 0 ? "draft" : "empty",
    data: dataReady ? "ready" : hasDataDefinition ? "draft" : "empty",
    results:
      plan.status === "failed"
        ? "error"
        : plan.status === "running"
          ? "running"
          : plan.result.raw
            ? "done"
            : "empty",
  };
};

export const getReadySlotCount = (
  plan: SimulationPlan,
  runtimeFiles: Record<string, File>,
) => {
  return plan.data.slots.filter((slot) => {
    if (slot.kind === "file") return Boolean(runtimeFiles[slot.id] || runtimeFiles[slot.name]);
    return slot.value !== null && slot.value !== "";
  }).length;
};

export const getTaskStatus = (plan: SimulationPlan) => {
  if (plan.status === "running") return "running";
  if (plan.status === "failed") return "failed";
  if (plan.status === "done") return "completed";
  return plan.result.status || "idle";
};
