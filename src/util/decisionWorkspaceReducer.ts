import type { WorkflowState } from "../types";

export type DecisionRightPanelMode = "form" | "execution";

export type DecisionWorkspaceState = {
  currentTaskSpec: any | null;
  modelContract: any | null;
  recommendedModelName: string | null;
  recommendedModelDesc: string | null;
  workflow: WorkflowState[];
  isRunning: boolean;
  modelTaskId: string | null;
  modelTaskStatus: string;
  modelRunResult: any | null;
  modelRunError: string | null;
  isAgentRunning: boolean;
  agentStatusText: string;
  agentStatusAnchorId: string | null;
  rightPanelMode: DecisionRightPanelMode;
};

type DecisionWorkspaceAction =
  | { type: "reset" }
  | { type: "patch"; patch: Partial<DecisionWorkspaceState> }
  | { type: "clear_recommendation" }
  | { type: "agent_start"; statusText: string; anchorId?: string | null }
  | { type: "agent_status"; statusText: string }
  | { type: "agent_done"; statusText: string }
  | { type: "agent_error"; statusText: string }
  | { type: "run_start" }
  | { type: "run_task_created"; taskId: string }
  | { type: "run_complete"; result: any | null }
  | { type: "run_fail"; error: string };

const DEFAULT_AGENT_STATUS = "Agent 正在思考...";

export const createInitialDecisionWorkspaceState = (): DecisionWorkspaceState => ({
  currentTaskSpec: null,
  modelContract: null,
  recommendedModelName: null,
  recommendedModelDesc: null,
  workflow: [],
  isRunning: false,
  modelTaskId: null,
  modelTaskStatus: "idle",
  modelRunResult: null,
  modelRunError: null,
  isAgentRunning: false,
  agentStatusText: DEFAULT_AGENT_STATUS,
  agentStatusAnchorId: null,
  rightPanelMode: "form",
});

export const decisionWorkspaceReducer = (
  state: DecisionWorkspaceState,
  action: DecisionWorkspaceAction,
): DecisionWorkspaceState => {
  switch (action.type) {
    case "reset":
      return createInitialDecisionWorkspaceState();

    case "patch":
      return { ...state, ...action.patch };

    case "clear_recommendation":
      return {
        ...state,
        currentTaskSpec: null,
        modelContract: null,
        recommendedModelName: null,
        recommendedModelDesc: null,
        workflow: [],
        isRunning: false,
        modelTaskId: null,
        modelTaskStatus: "idle",
        modelRunResult: null,
        modelRunError: null,
        rightPanelMode: "form",
      };

    case "agent_start":
      return {
        ...state,
        isAgentRunning: true,
        agentStatusText: action.statusText,
        agentStatusAnchorId: action.anchorId ?? state.agentStatusAnchorId,
      };

    case "agent_status":
      return { ...state, agentStatusText: action.statusText };

    case "agent_done":
      return {
        ...state,
        isAgentRunning: false,
        agentStatusText: action.statusText,
        agentStatusAnchorId: null,
      };

    case "agent_error":
      return {
        ...state,
        isRunning: false,
        isAgentRunning: false,
        agentStatusText: action.statusText,
        agentStatusAnchorId: null,
      };

    case "run_start":
      return {
        ...state,
        isRunning: true,
        modelTaskId: null,
        modelTaskStatus: "running",
        modelRunResult: null,
        modelRunError: null,
        rightPanelMode: "execution",
      };

    case "run_task_created":
      return {
        ...state,
        isRunning: false,
        modelTaskId: action.taskId,
        modelTaskStatus: "running",
        rightPanelMode: "execution",
      };

    case "run_complete":
      return {
        ...state,
        isRunning: false,
        modelTaskStatus: "completed",
        modelRunResult: action.result,
        modelRunError: null,
        rightPanelMode: "execution",
      };

    case "run_fail":
      return {
        ...state,
        isRunning: false,
        modelTaskStatus: "failed",
        modelRunError: action.error,
      };

    default:
      return state;
  }
};
