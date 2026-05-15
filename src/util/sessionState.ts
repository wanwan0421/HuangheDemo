import type { WorkflowState } from "../types";

const DECISION_SESSION_STATE_STORAGE_KEY = "geoagent_decision_session_state";

export type DecisionSessionState = {
  recommendedModelName: string | null;
  recommendedModelDesc: string | null;
  workflow: WorkflowState[];
  currentTaskSpec: any | null;
  modelContract: any | null;
  modelTaskId: string | null;
  modelTaskStatus: string;
  modelRunResult: any | null;
  modelRunError: string | null;
  rightPanelMode: "form" | "execution";
};

export const loadDecisionSessionStates = (): Record<string, DecisionSessionState> => {
  try {
    const raw = localStorage.getItem(DECISION_SESSION_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const persistDecisionSessionState = (sessionId: string, state: DecisionSessionState) => {
  try {
    const allStates = loadDecisionSessionStates();
    allStates[sessionId] = state;
    localStorage.setItem(DECISION_SESSION_STATE_STORAGE_KEY, JSON.stringify(allStates));
  } catch (error) {
    console.error("Persist decision session state failed", error);
  }
};

export const removeDecisionSessionState = (sessionId: string) => {
  try {
    const allStates = loadDecisionSessionStates();
    if (!(sessionId in allStates)) return;
    delete allStates[sessionId];
    localStorage.setItem(DECISION_SESSION_STATE_STORAGE_KEY, JSON.stringify(allStates));
  } catch (error) {
    console.error("Remove decision session state failed", error);
  }
};