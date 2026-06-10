import React from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  History,
  Layers3,
  Loader2,
  MapPinned,
  MessageSquareText,
  PanelBottomClose,
  PanelBottomOpen,
  Play,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import MapboxViewer from "../components/mapbox";
import type {
  Message,
  SimulationPlan,
  SimulationPlanInputSlot,
  SimulationPlanStatus,
} from "../types";
import { useDebouncedWorkbenchPersistence } from "../util/useDebouncedWorkbenchPersistence";
import { useWorkbenchRouteSession } from "../util/useWorkbenchRouteSession";
import {
  createInitialWorkbenchState,
  workbenchReducer,
  type RuntimeFilesSetter,
  type WorkbenchSectionId,
} from "../util/workbenchReducer";
import {
  getFlowHealth,
  getReadySlotCount,
  getTaskStatus,
  type FlowHealth,
} from "../util/workbenchPlanState";
import { collectMapLayers, type GeoJsonLayer } from "../util/workbenchMap";
import {
  getWorkbenchHistoryItems,
  getWorkbenchStorageKey,
  loadWorkbenchStorage,
  type WorkbenchHistoryItem,
} from "../util/workbenchStorage";
import { getPayloadToolKind } from "../util/messageUtils";
import {
  collectResultOutputs,
  isPlanRunnable,
  makeSimulationSlotId,
  mergeModelContractIntoPlan,
  mergeRecommendedModelIntoPlan,
  mergeTaskSpecIntoPlan,
  normalizePlanDraft,
  serializeSimulationPlan,
} from "../util/simulationPlan";

const BACK_URL = import.meta.env.VITE_BACK_URL;

type HistoryItem = WorkbenchHistoryItem;

const flowMeta: Array<{
  id: WorkbenchSectionId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "goal", label: "需求目标", shortLabel: "目标", icon: FileText },
  { id: "model", label: "模型选择", shortLabel: "模型", icon: Sparkles },
  { id: "data", label: "数据与参数", shortLabel: "数据", icon: Database },
  { id: "results", label: "运行结果", shortLabel: "结果", icon: MapPinned },
];

const statusLabels: Record<SimulationPlanStatus, string> = {
  drafting: "起草中",
  ready: "可运行",
  running: "运行中",
  done: "已完成",
  failed: "失败",
};

const fallbackMapLayers: GeoJsonLayer[] = [
  {
    name: "黄河干流示意",
    data: {
      conversion: {
        type: "vector",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Yellow River schematic" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [96.2, 35.9],
                  [99.4, 36.4],
                  [101.8, 36.1],
                  [104.2, 37.3],
                  [106.8, 37.7],
                  [109.1, 36.6],
                  [111.6, 35.0],
                  [113.8, 34.9],
                  [116.0, 36.0],
                  [119.0, 37.6],
                ],
              },
            },
          ],
        },
      },
    },
  },
  {
    name: "研究区占位范围",
    data: {
      conversion: {
        type: "vector",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Default study extent" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [94.8, 32.8],
                    [120.2, 32.8],
                    [120.2, 39.6],
                    [94.8, 39.6],
                    [94.8, 32.8],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
  },
];

const authFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? "include",
  });
};

export default function DecisionWorkbench() {
  const [workbenchState, dispatch] = React.useReducer(
    workbenchReducer,
    undefined,
    createInitialWorkbenchState,
  );
  const handleRouteSessionChange = React.useCallback((sessionId: string | null) => {
    dispatch({ type: "set_session", sessionId });
  }, []);
  const { navigateToRoot, navigateToSession } = useWorkbenchRouteSession({
    onRouteSessionChange: handleRouteSessionChange,
  });
  const {
    activeChatId,
    plan,
    runtimeFiles,
    messages,
    isChatOpen,
    activeSection,
    isAgentRunning,
    agentStatusText,
    agentStatusAnchorId,
  } = workbenchState;
  const [chatInput, setChatInput] = React.useState("");
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);
  const [mapLayers, setMapLayers] = React.useState<GeoJsonLayer[]>(fallbackMapLayers);
  const messageScrollRef = React.useRef<HTMLDivElement | null>(null);
  const statusCheckIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (!activeChatId) return;
    const stored = loadWorkbenchStorage()[activeChatId];
    if (!stored) return;
    dispatch({
      type: "hydrate_session",
      plan: stored.plan,
      messages: stored.messages || [],
    });
  }, [activeChatId]);

  const storageKey = React.useMemo(
    () => getWorkbenchStorageKey(activeChatId, plan.id),
    [activeChatId, plan.id],
  );

  useDebouncedWorkbenchPersistence({ storageKey, plan, messages });

  React.useEffect(() => {
    messageScrollRef.current?.scrollTo({
      top: messageScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isChatOpen]);

  React.useEffect(() => {
    let cancelled = false;
    const loadLayers = async () => {
      const layers = await collectMapLayers(plan.result.raw);
      if (!cancelled) {
        setMapLayers(layers.length > 0 ? layers : fallbackMapLayers);
      }
    };
    void loadLayers();
    return () => {
      cancelled = true;
    };
  }, [plan.result.raw]);

  React.useEffect(() => {
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);

  const canRun = React.useMemo(() => isPlanRunnable(plan, runtimeFiles), [plan, runtimeFiles]);
  const flowHealth = React.useMemo(() => getFlowHealth(plan, runtimeFiles), [plan, runtimeFiles]);
  const taskStatus = getTaskStatus(plan);
  const outputCount = plan.result.outputs.length;

  const updatePlan = React.useCallback((updater: (current: SimulationPlan) => SimulationPlan) => {
    dispatch({ type: "update_plan", updater });
  }, []);

  const setRuntimeFiles = React.useCallback<RuntimeFilesSetter>((updater) => {
    dispatch({ type: "set_runtime_files", updater });
  }, []);

  const ensureSession = async (title: string) => {
    if (activeChatId) return activeChatId;

    const response = await authFetch(`${BACK_URL}/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.slice(0, 20) || "模拟方案" }),
    });
    const data = await response.json();
    if (!data.success || !data.data?._id) {
      throw new Error("Failed to create session");
    }

    const nextSessionId = data.data._id as string;
    dispatch({ type: "set_session", sessionId: nextSessionId });
    navigateToSession(nextSessionId);
    return nextSessionId;
  };

  const handleSendMessage = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || isAgentRunning) return;

    dispatch({ type: "agent_start", statusText: "Agent 正在整理方案..." });
    updatePlan((current) => ({
      ...current,
      status: current.model.recommendedName ? current.status : "drafting",
      title: current.goal.objective ? current.title : prompt.slice(0, 36),
      goal: {
        ...current.goal,
        objective: current.goal.objective || prompt,
      },
      result:
        current.result.status === "idle"
          ? current.result
          : { taskId: null, status: "idle", raw: null, error: null, outputs: [] },
    }));

    let currentSessionId: string;
    try {
      currentSessionId = await ensureSession(prompt);
    } catch (error) {
      console.error("Create workbench session failed", error);
      dispatch({ type: "agent_error", statusText: "Agent 会话创建失败" });
      return;
    }

    const userMessageId = crypto.randomUUID();
    const anchorMessageId = crypto.randomUUID();
    dispatch({
      type: "agent_message_anchor",
      userMessageId,
      anchorMessageId,
      prompt,
    });

    const es = new EventSource(
      `${BACK_URL}/chat/sessions/${currentSessionId}/chat?query=${encodeURIComponent(prompt)}`,
      { withCredentials: true },
    );

    es.onmessage = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "tool_call") {
          dispatch({ type: "agent_status", statusText: "Agent 正在调用工具..." });
        }
        if (payload.type === "tool_result") {
          dispatch({ type: "agent_status", statusText: "Agent 正在更新方案..." });
        }
        if (payload.type === "token") {
          dispatch({ type: "agent_status", statusText: "Agent 正在补充说明..." });
          appendAiToken(payload.message ?? "");
        }

        if (payload.type === "plan_draft") {
          updatePlan((current) => normalizePlanDraft(payload.data, current));
        }
        if (payload.type === "task_spec_generated") {
          updatePlan((current) => mergeTaskSpecIntoPlan(current, payload.data));
        }
        if (payload.type === "model_contract_generated") {
          updatePlan((current) => mergeModelContractIntoPlan(current, payload.data));
        }
        if (payload.type === "tool_result" && getPayloadToolKind(payload) === "search_most_model") {
          updatePlan((current) => mergeRecommendedModelIntoPlan(current, payload.data));
        }

        if (payload.type === "final") {
          es.close();
          dispatch({ type: "agent_done", statusText: "Agent 已完成" });
          updatePlan((current) => ({
              ...current,
              status: current.model.recommendedName ? "ready" : current.status,
          }));
        }
      } catch (error) {
        console.error("Workbench SSE parse failed", error);
      }
    };

    es.onerror = () => {
      es.close();
      dispatch({ type: "agent_error", statusText: "Agent 连接中断" });
    };
  };

  const appendAiToken = (text: string) => {
    dispatch({ type: "append_ai_token", text });
  };

  const handlePromptSubmit = () => {
    const prompt = chatInput.trim();
    if (!prompt) return;
    setChatInput("");
    void handleSendMessage(prompt);
  };

  const openHistory = () => {
    setHistoryItems(getWorkbenchHistoryItems());
    setHistoryOpen(true);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setHistoryOpen(false);

    if (item.key.startsWith("local:")) {
      dispatch({
        type: "load_history",
        plan: item.plan,
        messages: item.messages || [],
        sessionId: null,
      });
      navigateToRoot();
    } else {
      dispatch({
        type: "load_history",
        plan: item.plan,
        messages: item.messages || [],
        sessionId: item.key,
      });
      navigateToSession(item.key);
    }
  };

  const handleAskAgentForSection = (sectionId: WorkbenchSectionId) => {
    const section = flowMeta.find((item) => item.id === sectionId);
    const prompt = [
      `请把模拟方案的「${section?.label || sectionId}」改得更清晰、更可执行。`,
      "保持界面所需的简洁表达，避免长文档式说明。",
      "当前方案 JSON：",
      JSON.stringify(serializeSimulationPlan(plan)),
    ].join("\n");
    void handleSendMessage(prompt);
  };

  const handleRun = async () => {
    if (!canRun || plan.status === "running") return;

    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    updatePlan((current) => ({
        ...current,
        status: "running",
        result: { taskId: null, status: "running", raw: null, error: null, outputs: [] },
    }));

    const formData = new FormData();
    formData.append(
      "info",
      JSON.stringify({
        modelName: plan.model.recommendedName,
        workflow: plan.model.workflow,
        plan: serializeSimulationPlan(plan),
      }),
    );

    plan.model.workflow.forEach((state) => {
      state.events.forEach((event) => {
        event.inputs.forEach((input) => {
          const slotId = makeSimulationSlotId(state.stateName, event.eventName, input.name);
          const slot = plan.data.slots.find((item) => item.id === slotId || item.name === input.name);
          const fieldKey = `${state.stateName}@@@${event.eventName}@@@${input.name}@@@${input.type}`;
          const file = runtimeFiles[slotId] || runtimeFiles[input.name] || (slot ? runtimeFiles[slot.id] : undefined);
          const value = slot?.value ?? plan.parameters.values[input.name];

          if (file) {
            formData.append(fieldKey, file);
          } else if (value !== undefined && value !== null) {
            formData.append(fieldKey, String(value));
          }
        });
      });
    });

    try {
      const response = await authFetch(`${BACK_URL}/model/run`, { method: "POST", body: formData });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData?.message || `Request failed: ${response.status}`);
      }

      const taskId = responseData.data?.taskId;
      if (!taskId) throw new Error("No taskId returned from backend");

      dispatch({ type: "set_active_section", section: "results" });
      updatePlan((current) => ({
          ...current,
          status: "running",
          result: { ...current.result, taskId, status: "running" },
      }));

      void pollTaskStatus(taskId);
      statusCheckIntervalRef.current = setInterval(() => {
        void pollTaskStatus(taskId);
      }, 2000);
    } catch (error) {
      updatePlan((current) => ({
          ...current,
          status: "failed",
          result: {
            ...current.result,
            status: "failed",
            error: error instanceof Error ? error.message : "Task publish failed",
          },
      }));
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await authFetch(`${BACK_URL}/model/status/${taskId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to get task status");

      const statusPayload = data.data;
      const currentStatus =
        typeof statusPayload === "string" ? statusPayload : statusPayload?.status ?? "Running";

      if (currentStatus === "Finished") {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }

        const resultResponse = await authFetch(`${BACK_URL}/model/result/${taskId}`);
        const resultData = await resultResponse.json();
        if (!resultData.success) throw new Error(resultData.message || "Failed to get result");

        const rawResult = resultData.data ?? null;
        updatePlan((current) => ({
            ...current,
            status: "done",
            result: {
              taskId,
              status: "completed",
              raw: rawResult,
              error: null,
              outputs: collectResultOutputs(rawResult),
            },
        }));
      } else if (currentStatus === "Failed" || currentStatus === "Error") {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        updatePlan((current) => ({
            ...current,
            status: "failed",
            result: {
              ...current.result,
              taskId,
              status: "failed",
              error: statusPayload?.error || "Task execution failed",
            },
        }));
      } else {
        updatePlan((current) => ({
            ...current,
            status: "running",
            result: { ...current.result, taskId, status: "running" },
        }));
      }
    } catch (error) {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
      updatePlan((current) => ({
          ...current,
          status: "failed",
          result: {
            ...current.result,
            taskId,
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to check task status",
          },
      }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-[#eef6ff] text-slate-950">
      <header className="shrink-0 bg-linear-to-r from-[#0b1f4d] via-[#123b82] to-[#0f73b7] px-4 py-3 text-white shadow-lg shadow-blue-950/15 lg:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-lg font-semibold text-white lg:text-xl">
              {plan.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/12 px-2 py-1 text-xs font-semibold text-sky-100 ring-1 ring-white/20">
                {statusLabels[plan.status]}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openHistory}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-white/16"
            >
              <History size={15} />
              历史方案
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "new_plan" });
                navigateToRoot();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-white/16"
            >
              <RefreshCw size={15} />
              新方案
            </button>
            <button
              type="button"
              disabled={!canRun || plan.status === "running"}
              onClick={() => void handleRun()}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-sky-400 disabled:bg-white/20 disabled:text-blue-100/60"
            >
              {plan.status === "running" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              运行
            </button>
          </div>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto]">
        <PlanFlow
          plan={plan}
          runtimeFiles={runtimeFiles}
          activeSection={activeSection}
          flowHealth={flowHealth}
          onSelect={(section) => dispatch({ type: "set_active_section", section })}
        />

        <section className="min-h-0 p-3 lg:p-4">
          <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-blue-100 bg-white shadow-lg shadow-blue-950/8">
              <MapboxViewer geoJsonDataArray={mapLayers} />
              <MapOverlay 
                layerCount={mapLayers.length}
                isFallback={mapLayers === fallbackMapLayers}
                outputCount={outputCount}
              />
            </div>

            <FlowInspector
              sectionId={activeSection}
              plan={plan}
              runtimeFiles={runtimeFiles}
              taskStatus={taskStatus}
              updatePlan={updatePlan}
              setRuntimeFiles={setRuntimeFiles}
              onAskAgent={handleAskAgentForSection}
            />
          </div>
        </section>

        <ChatDock
          open={isChatOpen}
          messages={messages}
          chatInput={chatInput}
          isAgentRunning={isAgentRunning}
          agentStatusText={agentStatusText}
          agentStatusAnchorId={agentStatusAnchorId}
          messageScrollRef={messageScrollRef}
          onToggle={() => dispatch({ type: "set_chat_open", open: (current) => !current })}
          onInputChange={setChatInput}
          onSubmit={handlePromptSubmit}
        />
      </main>

      {historyOpen && (
        <HistoryPanel
          items={historyItems}
          currentKey={storageKey}
          onClose={() => setHistoryOpen(false)}
          onLoad={loadHistoryItem}
        />
      )}
    </div>
  );
}

function PlanFlow({
  plan,
  runtimeFiles,
  activeSection,
  flowHealth,
  onSelect,
}: {
  plan: SimulationPlan;
  runtimeFiles: Record<string, File>;
  activeSection: WorkbenchSectionId;
  flowHealth: Record<WorkbenchSectionId, FlowHealth>;
  onSelect: (sectionId: WorkbenchSectionId) => void;
}) {
  const summaries: Record<WorkbenchSectionId, string> = {
    goal: plan.goal.objective || "输入一句需求",
    model: plan.model.recommendedName || "等待推荐模型",
    data: `${getReadySlotCount(plan, runtimeFiles)}/${plan.data.slots.length} 项数据，${Object.keys(plan.parameters.values).length} 个参数`,
    results:
      plan.status === "running"
        ? "计算中"
        : plan.result.outputs.length > 0
          ? `${plan.result.outputs.length} 个输出`
          : "等待运行",
  };

  return (
    <section className="shrink-0 border-b border-blue-100 bg-white/95 px-3 py-3 shadow-sm shadow-blue-950/5 lg:px-5">
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {flowMeta.map((item, index) => {
          const Icon = item.icon;
          const active = item.id === activeSection;
          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex min-w-[190px] items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                  active
                    ? "border-blue-500 bg-linear-to-br from-blue-50 to-sky-50 shadow-sm shadow-blue-950/8"
                    : "border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    active ? "bg-blue-600 text-white shadow-sm" : "bg-sky-50 text-blue-700"
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {item.label}
                    <HealthDot health={flowHealth[item.id]} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{summaries[item.id]}</span>
                </span>
              </button>
              {index < flowMeta.length - 1 && (
                <span className="hidden items-center text-slate-300 sm:flex">
                  <ChevronRight size={18} />
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

function FlowInspector({
  sectionId,
  plan,
  runtimeFiles,
  taskStatus,
  updatePlan,
  setRuntimeFiles,
  onAskAgent,
}: {
  sectionId: WorkbenchSectionId;
  plan: SimulationPlan;
  runtimeFiles: Record<string, File>;
  taskStatus: string;
  updatePlan: (updater: (current: SimulationPlan) => SimulationPlan) => void;
  setRuntimeFiles: RuntimeFilesSetter;
  onAskAgent: (sectionId: WorkbenchSectionId) => void;
}) {
  const meta = flowMeta.find((item) => item.id === sectionId) || flowMeta[0];

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-blue-100 bg-white shadow-lg shadow-blue-950/8">
      <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">配置</p>
          <h2 className="truncate text-base font-semibold text-slate-950">{meta.label}</h2>
        </div>
        <button
          type="button"
          onClick={() => onAskAgent(sectionId)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Wand2 size={13} />
          Agent 修改
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {sectionId === "goal" && <GoalPanel plan={plan} updatePlan={updatePlan} />}
        {sectionId === "model" && <ModelPanel plan={plan} />}
        {sectionId === "data" && (
          <DataPanel
            plan={plan}
            runtimeFiles={runtimeFiles}
            updatePlan={updatePlan}
            setRuntimeFiles={setRuntimeFiles}
          />
        )}
        {sectionId === "results" && <ResultPanel plan={plan} taskStatus={taskStatus} />}
      </div>
    </aside>
  );
}

function GoalPanel({
  plan,
  updatePlan,
}: {
  plan: SimulationPlan;
  updatePlan: (updater: (current: SimulationPlan) => SimulationPlan) => void;
}) {
  return (
    <div className="space-y-3">
      <TextAreaField
        label="模拟目标"
        value={plan.goal.objective}
        rows={4}
        placeholder="例如：预测黄河流域 2035 年土地利用变化"
        onChange={(value) =>
          updatePlan((current) => ({
            ...current,
            title: value.slice(0, 36) || current.title,
            goal: { ...current.goal, objective: value },
          }))
        }
      />
      <TextField
        label="研究区域"
        value={plan.goal.studyArea}
        placeholder="黄河流域 / 某省市 / 自定义范围"
        onChange={(value) =>
          updatePlan((current) => ({ ...current, goal: { ...current.goal, studyArea: value } }))
        }
      />
      <TextField
        label="时间范围"
        value={plan.goal.timeHorizon}
        placeholder="2020-2035"
        onChange={(value) =>
          updatePlan((current) => ({ ...current, goal: { ...current.goal, timeHorizon: value } }))
        }
      />
      <MiniList
        title="判断标准"
        values={plan.goal.successCriteria}
        empty="运行完成后查看地图和输出文件"
      />
    </div>
  );
}

function ModelPanel({
  plan,
}: {
  plan: SimulationPlan;
}) {
  return (
    <div className="space-y-3">
      <ReadOnlyField label="推荐模型" value={plan.model.recommendedName || "等待 Agent 推荐"} />
      <ReadOnlyField label="模型说明" value={plan.model.description || "暂无模型说明"} multiline />

      <MiniList
        title="备选模型"
        values={plan.model.alternatives.map((item) => item.description ? `${item.name}：${item.description}` : item.name)}
        empty="暂无备选模型"
      />
    </div>
  );
}

function DataPanel({
  plan,
  runtimeFiles,
  updatePlan,
  setRuntimeFiles,
}: {
  plan: SimulationPlan;
  runtimeFiles: Record<string, File>;
  updatePlan: (updater: (current: SimulationPlan) => SimulationPlan) => void;
  setRuntimeFiles: RuntimeFilesSetter;
}) {
  const updateSlotValue = (slot: SimulationPlanInputSlot, value: string) => {
    updatePlan((current) => ({
      ...current,
      data: {
        ...current.data,
        slots: current.data.slots.map((item) => (item.id === slot.id ? { ...item, value } : item)),
      },
      parameters:
        slot.kind === "file"
          ? current.parameters
          : {
              ...current.parameters,
              values: { ...current.parameters.values, [slot.name]: value },
            },
    }));
  };

  const updateSlotFile = (slot: SimulationPlanInputSlot, file: File) => {
    setRuntimeFiles((current) => ({ ...current, [slot.id]: file }));
    updatePlan((current) => ({
      ...current,
      data: {
        ...current.data,
        slots: current.data.slots.map((item) =>
          item.id === slot.id ? { ...item, fileName: file.name, value: null } : item,
        ),
      },
    }));
  };

  if (plan.data.slots.length === 0 && Object.keys(plan.parameters.values).length === 0) {
    return (
      <EmptyState
        title="还没有数据槽"
        body="发送需求后，Agent 会根据推荐模型生成需要的数据和参数。"
      />
    );
  }

  return (
    <div className="space-y-3">
      {plan.data.slots.map((slot) => {
        const file = runtimeFiles[slot.id] || runtimeFiles[slot.name];
        const needsFileReselect = slot.kind === "file" && !file && Boolean(slot.fileName);
        return (
          <div key={slot.id} className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm shadow-blue-950/4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{slot.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{slot.source || slot.type}</p>
              </div>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{slot.type}</span>
            </div>
            {slot.description && <p className="mb-2 line-clamp-2 text-xs text-slate-500">{slot.description}</p>}
            {slot.kind === "file" ? (
              <>
                <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/30 px-3 py-2 text-sm transition hover:border-blue-400 hover:bg-blue-50">
                  <span className="min-w-0 truncate text-slate-700">
                    {file?.name || (slot.fileName ? `上次选择：${slot.fileName}` : "选择文件")}
                  </span>
                  <Upload size={16} className="shrink-0 text-blue-700" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (selected) updateSlotFile(slot, selected);
                    }}
                  />
                </label>
                {needsFileReselect && (
                  <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                    历史方案不会保存本地文件，请重新选择该文件后再运行。
                  </p>
                )}
              </>
            ) : (
              <input
                value={slot.value ?? ""}
                onChange={(event) => updateSlotValue(slot, event.target.value)}
                className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            )}
          </div>
        );
      })}

      <div className="rounded-lg border border-sky-100 bg-linear-to-br from-sky-50 to-blue-50/70 p-3">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-blue-700" />
          <p className="text-sm font-semibold text-slate-900">参数</p>
        </div>
        <ParameterPanel plan={plan} updatePlan={updatePlan} />
      </div>
    </div>
  );
}

function ParameterPanel({
  plan,
  updatePlan,
}: {
  plan: SimulationPlan;
  updatePlan: (updater: (current: SimulationPlan) => SimulationPlan) => void;
}) {
  const entries = Object.entries(plan.parameters.values);

  const updateParameter = (name: string, value: string) => {
    updatePlan((current) => ({
      ...current,
      parameters: {
        ...current.parameters,
        values: { ...current.parameters.values, [name]: value },
      },
      data: {
        ...current.data,
        slots: current.data.slots.map((slot) => (slot.name === name ? { ...slot, value } : slot)),
      },
    }));
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <EmptyState title="暂无参数" body="参数会随模型输入自动出现，也可以让 Agent 补齐。" />
      ) : (
        entries.map(([name, value]) => (
          <TextField
            key={name}
            label={name}
            value={value === null ? "" : String(value)}
            onChange={(nextValue) => updateParameter(name, nextValue)}
          />
        ))
      )}
      <TextAreaField
        label="备注"
        value={plan.parameters.notes}
        rows={3}
        onChange={(value) =>
          updatePlan((current) => ({ ...current, parameters: { ...current.parameters, notes: value } }))
        }
      />
    </div>
  );
}

function ResultPanel({ plan, taskStatus }: { plan: SimulationPlan; taskStatus: string }) {
  if (taskStatus === "running") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
        <div className="flex items-center gap-2 font-semibold">
          <Loader2 size={16} className="animate-spin" />
          模型正在运行
        </div>
        <p className="mt-2 text-sm">完成后地图会自动切换为结果图层。</p>
      </div>
    );
  }

  if (taskStatus === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle size={16} />
          运行失败
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm">{plan.result.error || "请检查输入后重试。"}</p>
      </div>
    );
  }

  if (plan.result.outputs.length === 0) {
    return <EmptyState title="暂无结果" body="点击运行后，结果文件和地图图层会出现在这里。" />;
  }

  return (
    <div className="space-y-3">
      {plan.result.outputs.map((output, index) => (
        <a
          key={`${output.url}-${index}`}
          href={output.url}
          className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 px-3 py-2 text-sm hover:border-blue-300 hover:bg-blue-50"
        >
          <span className="min-w-0 truncate font-medium text-slate-800">{output.name}</span>
          <span className="shrink-0 text-xs font-semibold text-blue-700">下载</span>
        </a>
      ))}
    </div>
  );
}

function MapOverlay({
  layerCount,
  isFallback,
  outputCount,
}: {
  layerCount: number;
  isFallback: boolean;
  outputCount: number;
}) {
  return (
    <>
      <div className="absolute left-3 top-3 max-w-md rounded-lg border border-blue-100 bg-white/95 px-3 py-2 shadow-lg shadow-blue-950/10 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Layers3 size={15} className="text-blue-700" />
          {isFallback ? "地理底图预览" : "模拟结果地图"}
        </div>
        <p className="mt-1 text-xs text-blue-900/70">
          {isFallback
            ? "当前显示黄河流域示意图层，运行后自动替换为模型输出。"
            : `${layerCount} 个图层，${outputCount} 个结果文件。`}
        </p>
      </div>

    </>
  );
}

function ChatDock({
  open,
  messages,
  chatInput,
  isAgentRunning,
  agentStatusText,
  agentStatusAnchorId,
  messageScrollRef,
  onToggle,
  onInputChange,
  onSubmit,
}: {
  open: boolean;
  messages: Message[];
  chatInput: string;
  isAgentRunning: boolean;
  agentStatusText: string;
  agentStatusAnchorId: string | null;
  messageScrollRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className={`shrink-0 border-t border-blue-100 bg-white shadow-[0_-8px_24px_rgba(30,64,175,0.08)] transition-all ${open ? "h-72" : "h-12"}`}>
      <div className="flex h-12 items-center justify-between border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-4">
        <div className="flex items-center gap-2">
          <MessageSquareText size={16} className="text-blue-700" />
          <span className="text-sm font-semibold text-slate-800">智能助手</span>
          {isAgentRunning && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white px-2 py-1 text-xs text-blue-700">
              <Loader2 size={12} className="animate-spin" />
              {agentStatusText}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1.5 text-blue-700 transition hover:bg-white hover:text-blue-900"
          aria-label={open ? "收起聊天" : "展开聊天"}
        >
          {open ? <PanelBottomClose size={18} /> : <PanelBottomOpen size={18} />}
        </button>
      </div>

      {open && (
        <div className="grid h-[calc(100%-48px)] grid-rows-[1fr_auto]">
          <div ref={messageScrollRef} className="overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <p>输入一句模拟需求，Agent 会生成一条可运行流程。</p>
              </div>
            ) : (
              <div className="mx-auto max-w-6xl space-y-3">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isStatus={isAgentRunning && message.id === agentStatusAnchorId}
                    statusText={agentStatusText}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-3">
            <div className="mx-auto flex max-w-6xl items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder="描述需求，或让 Agent 调整当前方案..."
                className="min-h-10 max-h-24 flex-1 resize-none rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                disabled={!chatInput.trim() || isAgentRunning}
                onClick={onSubmit}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300"
                aria-label="发送"
              >
                {isAgentRunning ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HistoryPanel({
  items,
  currentKey,
  onClose,
  onLoad,
}: {
  items: HistoryItem[];
  currentKey: string;
  onClose: () => void;
  onLoad: (item: HistoryItem) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-blue-950/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-lg border border-blue-100 bg-white shadow-2xl shadow-blue-950/20">
        <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-linear-to-r from-blue-50 to-sky-50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">History</p>
            <h2 className="text-base font-semibold text-slate-950">历史方案</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-blue-700 hover:bg-blue-100"
            aria-label="关闭历史方案"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <EmptyState title="暂无历史方案" body="发送需求或编辑方案后会自动保存。" />
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const active = item.key === currentKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onLoad(item)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? "border-blue-500 bg-linear-to-br from-blue-50 to-sky-50 shadow-sm"
                        : "border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                        {item.plan.title || "未命名方案"}
                      </p>
                      {active && <span className="shrink-0 text-xs font-semibold text-blue-700">当前</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {item.plan.goal.objective || item.plan.model.recommendedName || "空白方案"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatTime(item.plan.updatedAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  isStatus,
  statusText,
}: {
  message: Message;
  isStatus: boolean;
  statusText: string;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-blue-600 text-white shadow-sm"
            : "border border-blue-100 bg-white text-slate-800 shadow-sm"
        }`}
      >
        {isStatus && !message.content ? (
          <span className="inline-flex items-center gap-2 text-blue-700">
            <Bot size={14} />
            {statusText}
          </span>
        ) : (
          <p className="whitespace-pre-wrap">{message.content || statusText}</p>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const fieldId = React.useId();

  return (
    <label htmlFor={fieldId} className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        id={fieldId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  const fieldId = React.useId();

  return (
    <label htmlFor={fieldId} className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        id={fieldId}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div
        className={`rounded-lg border border-blue-100 bg-blue-50/45 px-3 py-2 text-sm text-slate-700 ${
          multiline ? "min-h-20 whitespace-pre-wrap leading-relaxed" : "truncate"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniList({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/45 p-3">
      <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p>
      {values.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {values.map((value, index) => (
            <li key={`${value}-${index}`} className="flex gap-2 text-sm text-slate-600">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-blue-600" />
              <span>{value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/45 p-5 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function HealthDot({ health }: { health: FlowHealth }) {
  const className = {
    empty: "bg-slate-300",
    draft: "bg-amber-400",
    ready: "bg-blue-500",
    running: "bg-blue-500 animate-pulse",
    done: "bg-green-500",
    error: "bg-red-500",
  }[health];
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${className}`} />;
}

function formatTime(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}
