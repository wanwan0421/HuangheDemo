import type { Dispatch, SetStateAction } from "react";
import type { Message, SimulationPlan, SimulationPlanSectionId } from "../types";
import { createInitialSimulationPlan } from "./simulationPlan";

export type WorkbenchSectionId = Exclude<SimulationPlanSectionId, "parameters">;

export type WorkbenchState = {
  activeChatId: string | null;
  plan: SimulationPlan;
  runtimeFiles: Record<string, File>;
  messages: Message[];
  isChatOpen: boolean;
  activeSection: WorkbenchSectionId;
  isAgentRunning: boolean;
  agentStatusText: string;
  agentStatusAnchorId: string | null;
};

type WorkbenchAction =
  | { type: "set_session"; sessionId: string | null }
  | { type: "hydrate_session"; plan: SimulationPlan; messages: Message[] }
  | { type: "new_plan" }
  | { type: "load_history"; plan: SimulationPlan; messages: Message[]; sessionId: string | null }
  | { type: "update_plan"; updater: (current: SimulationPlan) => SimulationPlan }
  | { type: "set_runtime_files"; updater: SetStateAction<Record<string, File>> }
  | { type: "set_chat_open"; open: boolean | ((current: boolean) => boolean) }
  | { type: "set_active_section"; section: WorkbenchSectionId }
  | { type: "agent_start"; statusText: string }
  | { type: "agent_message_anchor"; userMessageId: string; anchorMessageId: string; prompt: string }
  | { type: "agent_status"; statusText: string }
  | { type: "agent_done"; statusText: string }
  | { type: "agent_error"; statusText: string }
  | { type: "append_ai_token"; text: string };

const DEFAULT_AGENT_STATUS = "Agent 待命";

export const createInitialWorkbenchState = (): WorkbenchState => ({
  activeChatId: null,
  plan: createInitialSimulationPlan(),
  runtimeFiles: {},
  messages: [],
  isChatOpen: true,
  activeSection: "goal",
  isAgentRunning: false,
  agentStatusText: DEFAULT_AGENT_STATUS,
  agentStatusAnchorId: null,
});

export const workbenchReducer = (
  state: WorkbenchState,
  action: WorkbenchAction,
): WorkbenchState => {
  switch (action.type) {
    case "set_session":
      return { ...state, activeChatId: action.sessionId };

    case "hydrate_session":
      return {
        ...state,
        plan: action.plan,
        messages: action.messages,
      };

    case "new_plan":
      return {
        ...state,
        activeChatId: null,
        plan: createInitialSimulationPlan(),
        runtimeFiles: {},
        messages: [],
        activeSection: "goal",
        isAgentRunning: false,
        agentStatusText: DEFAULT_AGENT_STATUS,
        agentStatusAnchorId: null,
      };

    case "load_history":
      return {
        ...state,
        activeChatId: action.sessionId,
        plan: action.plan,
        messages: action.messages,
        runtimeFiles: {},
        activeSection: "goal",
        isAgentRunning: false,
        agentStatusText: DEFAULT_AGENT_STATUS,
        agentStatusAnchorId: null,
      };

    case "update_plan":
      return {
        ...state,
        plan: stampPlan(action.updater(state.plan)),
      };

    case "set_runtime_files": {
      const nextRuntimeFiles =
        typeof action.updater === "function"
          ? action.updater(state.runtimeFiles)
          : action.updater;
      return {
        ...state,
        runtimeFiles: nextRuntimeFiles,
      };
    }

    case "set_chat_open": {
      const nextOpen =
        typeof action.open === "function" ? action.open(state.isChatOpen) : action.open;
      return { ...state, isChatOpen: nextOpen };
    }

    case "set_active_section":
      return { ...state, activeSection: action.section };

    case "agent_start":
      return {
        ...state,
        isChatOpen: true,
        isAgentRunning: true,
        agentStatusText: action.statusText,
      };

    case "agent_message_anchor":
      return {
        ...state,
        agentStatusAnchorId: action.anchorMessageId,
        messages: [
          ...state.messages,
          { id: action.userMessageId, role: "user", content: action.prompt },
          { id: action.anchorMessageId, role: "AI", type: "tool", content: "", tools: [] },
        ],
      };

    case "agent_status":
      return {
        ...state,
        agentStatusText: action.statusText,
      };

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
        isAgentRunning: false,
        agentStatusText: action.statusText,
        agentStatusAnchorId: null,
      };

    case "append_ai_token": {
      if (!action.text) return state;
      const nextMessages = [...state.messages];
      const last = nextMessages[nextMessages.length - 1];

      if (last && last.role === "AI" && last.type === "text") {
        nextMessages[nextMessages.length - 1] = {
          ...last,
          content: last.content + action.text,
          started: true,
        };
      } else {
        nextMessages.push({
          id: crypto.randomUUID(),
          role: "AI",
          type: "text",
          content: action.text,
          started: true,
        });
      }

      return {
        ...state,
        messages: nextMessages,
      };
    }

    default:
      return state;
  }
};

export type RuntimeFilesSetter = Dispatch<SetStateAction<Record<string, File>>>;

const stampPlan = (plan: SimulationPlan): SimulationPlan => ({
  ...plan,
  updatedAt: new Date().toISOString(),
});
