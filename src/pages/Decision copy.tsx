import React, { useState } from "react";
import { SquarePen, Search, MoreVertical, Sparkles, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatInput from "../components/ChatInput";
import ConfigurationSidebar from "../components/ConfigurationSidebar";
import TaskSpecCard from "../components/TaskSpecCard";
import ToolTimeline from "../components/ToolTimeline";
import ModelExecuteProcess from "../components/ModelExecuteProcess";
import type { WorkflowState, Message} from "../types";

// 后端API基础URL
const BACK_URL = import.meta.env.VITE_BACK_URL;

// Reducer Action Types
type Action = { type: "ADD_STEP"; payload: string } | { type: "RESET" };

function runStatusReducer(state: string[], action: Action): string[] {
  switch (action.type) {
    case "ADD_STEP":
      return [...state, action.payload];
    case "RESET":
      return [];
    default:
      return state;
  }
}

export default function IntelligentDecision() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // 配置侧面板状态
  const [isConfigSidebarOpen, setIsConfigSidebarOpen] = useState(false);

  // 当前任务需求
  const [currentTaskSpec, setCurrentTaskSpec] = useState<any | null>(null);
  // 当前推荐模型要求
  const [modelContract, setModelContract] = useState<any | null>(null);

  // 推荐的模型信息
  const [recommendedModelName, setRecommendedModelName] = useState<string | null>(null);
  const [recommendedModelDesc, setRecommendedModelDesc] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState[]>([]);

  // 用户上传的数据
  const [uploadedData, setUploadedData] = useState<
    Record<string, File | string | number | null>
  >({});

  // 设置模型运行状态
  const [runStatus, dispatch] = React.useReducer(runStatusReducer, []);
  const [isRunning, setIsRunning] = useState(false);

  // 设置对话列表状态
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null);
  // 记录当前操作是用户从左侧列表点击切换还是发送一条消息时自动创建新对话
  const isManualSwitch = React.useRef(false);

  // 聊天窗口自动滚动到底部
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // 定义初始状态或使用重置函数
  const resetToInitialState = (keepSessionId: boolean = false) => {
    setMessages([]);
    setRecommendedModelName(null);
    setRecommendedModelDesc(null);
    setWorkflow([]);
    setUploadedData({});
    setIsRunning(false);
    dispatch({ type: "RESET" });
    setCurrentTaskSpec(null);
    setModelContract(null);
    setIsConfigSidebarOpen(false);

    if (!keepSessionId) {
      setActiveChatId(null);
      isManualSwitch.current = false;
    }
  };

  // 处理对话切换或者初始化
  React.useEffect(() => {
    // 如果没有ID或者是发送消息时自动设置的ID，则不触发历史加载
    if (!activeChatId || !isManualSwitch.current) return;

    resetToInitialState(true);

    const currentSession = sessionList.find((s) => s._id === activeChatId);
    if (currentSession?.recommendedModel) {
      setRecommendedModelName(currentSession.recommendedModel.name);
      setRecommendedModelDesc(currentSession.recommendedModel.description);
      setWorkflow(currentSession.recommendedModel.workflow);
      setCurrentTaskSpec(currentSession.taskSpec || null);
      setModelContract(currentSession.modelContract || null);
    }

    // 调用后端获取历史消息的接口
    fetch(`${BACK_URL}/chat/sessions/${activeChatId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mappedMessages: Message[] = data.data.map((m: any) => {
            const isAI = m.role !== "user";

            // 转换工具数据格式
            const mappedTools = Array.isArray(m.tools)
              ? m.tools.map((t: any) => ({
                  kind: t.tool,
                  status: "success" as const,
                  title:
                    t.tool === "search_relevant_indices"
                      ? "指标库检索完成"
                      : t.tool === "search_relevant_models"
                      ? "模型库检索完成"
                      : t.tool === "search_most_model"
                      ? "模型推荐完成"
                      : t.tool === "get_model_details"
                      ? "详情读取完成"
                      : t.tool === "tool_prepare_file"
                      ? "数据准备完成"
                      : t.tool === "tool_detect_format"
                      ? "数据格式检测完成"
                      : t.tool === "tool_analyze_raster"
                      ? "栅格数据分析完成"
                      : t.tool === "tool_analyze_vector"
                      ? "矢量数据分析完成"
                      : t.tool === "tool_analyze_table"
                      ? "表格数据分析完成"
                      : t.tool === "tool_analyze_timeseries"
                      ? "时间序列数据分析完成"
                      : t.tool === "tool_analyze_parameter"
                      ? "参数数据分析完成"
                      : "工具执行完成",
                  result: t.data || t.profile,
                  id: crypto.randomUUID(),
                }))
              : [];

            return {
              id: m._id || crypto.randomUUID(),
              role: isAI ? "AI" : "user",
              content: m.content || "",
              type: mappedTools.length > 0 ? "tool" : "text",
              tools: mappedTools,
              profile: m.profile || null, 
              isScanFinished: !!m.profile,
              started: true,
            };
          });
          setMessages(mappedMessages);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch chat history:", err);
      });
  }, [activeChatId]);

  // 初始化获取用户所有的历史对话
  React.useEffect(() => {
    fetch(`${BACK_URL}/chat/sessions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessionList(data.data);
          // // 如果有数据且当前没选中，默认选择第一个
          // if (data.data.length > 0 && !activeChatId) {
          //   setActiveChatId(data.data[data.data.length - 1]._id);
          // }
        }
      });
  }, []);

  // 全局点击后收起会话菜单
  React.useEffect(() => {
    const handleClickOutside = () => setOpenSessionMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // 重命名会话
  const handleRenameSession = async (sessionId: string, currentTitle: string) => {
    const newTitle = window.prompt("Rename session", currentTitle || "New Chat");
    if (!newTitle || newTitle.trim() === currentTitle) return;

    const title = newTitle.trim();
    const prev = sessionList;
    setSessionList((p) => p.map((s) => (s._id === sessionId ? { ...s, title } : s)));

    try {
      const res = await fetch(`${BACK_URL}/chat/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Rename failed");
    } catch (err) {
      console.error("Rename session failed", err);
      setSessionList(prev);
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string) => {
    const ok = window.confirm("Delete this session?");
    if (!ok) return;

    const prev = sessionList;
    setSessionList((p) => p.filter((s) => s._id !== sessionId));
    if (activeChatId === sessionId) {
      resetToInitialState(false);
    }

    try {
      const res = await fetch(`${BACK_URL}/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error("Delete failed");
    } catch (err) {
      console.error("Delete session failed", err);
      setSessionList(prev);
    }
  };

  const handleSendMessage = async (prompt: string) => {
    // 创建对话Id
    let currentSessionId = activeChatId;
    if (!currentSessionId) {
      try {
        const response = await fetch(`${BACK_URL}/chat/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: prompt.slice(0, 20) }),
        });
        const data = await response.json();

        if (data.success && data.data._id) {
          currentSessionId = data.data._id;
          setActiveChatId(currentSessionId);
          // 更新左侧对话列表
          setSessionList((prev) => [data.data, ...prev]);
        } else {
          throw new Error("Failed to create new session");
        }
      } catch (err) {
        console.error("Error creating new session:", err);
        return;
      }
    }

    // 为每次请求生成独立的 AI 消息
    // 先插入用户消息和一个空的工具消息
    const userMessageId = crypto.randomUUID();
    const toolMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: prompt },

      {
        id: toolMessageId,
        role: "AI",
        type: "tool",
        content: "",
        tools: [],
      },
    ]);

    // 重置状态
    setRecommendedModelName(null);
    setRecommendedModelDesc(null);
    setWorkflow([]);
    dispatch({ type: "RESET" });
    setIsRunning(false);
    setCurrentTaskSpec(null);
    setModelContract(null);

    // 建立 SSE 连接（Node → Python → Agent）
    const es = new EventSource(
      `${BACK_URL}/chat/sessions/${currentSessionId}/chat?query=${encodeURIComponent(
        prompt
      )}`
    );

    es.onmessage = (e: MessageEvent) => {
      if (!e.data) return;

      try {
        const payload = JSON.parse(e.data);
        console.log("SSE Payload:", payload);
        setMessages((prev) => {
          // 处理文本消息
          if (payload.type === "token") {
            const text = payload.message ?? "";
            if (!text) return prev;

            const updatedMessages = [...prev];
            const lastMsg = updatedMessages[updatedMessages.length - 1];

            // 如果最后一条已经是AI文本块，则更新它
            if (lastMsg && lastMsg.role === "AI" && lastMsg.type === "text") {
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + text,
                started: true,
              };
            } else {
              // 否则新起一块AI文本消息
              updatedMessages.push({
                id: crypto.randomUUID(),
                role: "AI",
                content: text,
                type: "text",
                started: true,
              });
            }
            return updatedMessages;
          }

          // 处理所有工具事件
          return prev.map((msg) => {
            if (msg.id !== toolMessageId) return msg;

            let updatedTools = [...(msg.tools ?? [])];

            // 工具开始运行
            if (payload.type === "tool_call") {
              if (!updatedTools.find((t) => t.kind === payload.tool)) {
                updatedTools.push({
                  id: crypto.randomUUID(),
                  kind: payload.tool,
                  status: "running",
                  title: getToolTitle(payload.tool),
                });
              }
            }

            // 工具运行完成
            if (payload.type === "tool_result") {
              updatedTools = updatedTools.map((t) =>
                t.kind === payload.tool
                  ? {
                      ...t,
                      status: "success" as const,
                      type: 'tool',
                      title: getFinishToolTitle(payload.tool),
                      result: payload.data,
                    }
                  : t
              );
            }

            // 最终完成
            if (payload.type === "final") {
              es.close();
            }

            return { ...msg, tools: updatedTools };
          });

        });

        if (payload.type === "tool_result" && payload.tool === "get_model_details") {
          setRecommendedModelName(payload.data?.name ?? "");
          setRecommendedModelDesc(payload.data?.description ?? "");
          setWorkflow(payload.data?.workflow ?? []);
          setIsRunning(false);

          setSessionList((prev) =>
            prev.map((s) =>
              s._id === currentSessionId ? 
              {...s,
              recommendedModel: {
                status: "success",
                name: payload.data?.name ?? "",
                md5: payload.data?.md5 ?? "",
                description: payload.data?.description ?? "",
                workflow: payload.data?.workflow ?? []
              }}: s)
          );
        }

        if (payload.type === "task_spec_generated") {
          const taskSpec = payload.data;
          if (taskSpec && Object.keys(taskSpec).length > 0) {
            setCurrentTaskSpec(payload.data);
          }
        }

        if (payload.type === "model_contract_generated") {
          const modelContract = payload.data.Required_slots;
          if (modelContract && modelContract.length > 0) {
            setModelContract(payload.data);
          }
        }
      } catch (err) {
        console.error("Invalid SSE data:", e.data);
      }
    };

    es.onerror = (err) => {
      console.error("[SSE error]", err);
      es.close();
      setIsRunning(false);
    };

    const getToolTitle = (toolKind: string) => {
      const mapping: any = {
        search_relevant_indices: "正在检索地理指标库...",
        search_relevant_models: "正在检索地理模型库...",
        search_most_model: "正在推荐最合适的模型...",
        get_model_details: "正在读取模型工作流详情...",
      };
      return mapping[toolKind] || "正在处理...";
    };

    const getFinishToolTitle = (toolKind: string) => {
      const mapping: any = {
        search_relevant_indices: "指标库检索完成",
        search_relevant_models: "模型库检索完成",
        search_most_model: "模型推荐完成",
        get_model_details: "模型工作流详情读取完成",
      };
      return mapping[toolKind] || "处理完成";
    };
  };

  const handleDateScan = async (file: File) => {
    if (!activeChatId) {
      console.error("No active session found");
      return;
    }

    const toolMessageId = crypto.randomUUID();
    const scanToolId = crypto.randomUUID();
    let isDone = false;

    // 插入到前面的messages数组中
    setMessages((prev) => [
      ...prev,
      {
        id: toolMessageId,
        role: "AI",
        type: "data",
        content: "",
        tools: [
          {
            id: scanToolId,
            kind: "tool_prepare_file",
            status: "running",
            title: `正在扫描数据: ${file.name}`,
          },
        ],
      },
    ]);

    try {
      // 先将文件上传到后端获取临时路径
      const forData = new FormData();
      forData.append("file", file);
      forData.append("sessionId", activeChatId);

      const uploadRes = await fetch(`${BACK_URL}/data/upload`, {
        method: "POST",
        body: forData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) throw new Error("文件上传失败");
      const serverFilePath = uploadData.filePath;

      // 建立 SSE 连接进行数据扫描
      const es = new EventSource(
        `${BACK_URL}/data-mapping/sessions/${activeChatId}/data-scan?filePath=${encodeURIComponent(
          serverFilePath
        )}`
      );

      es.onmessage = (e) => {
        if (!e.data) return;

        const payload = JSON.parse(e.data);
        console.log("Data Scan SSE Payload:", payload);

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== toolMessageId) return msg;

            let updatedTools = [...(msg.tools || [])];

            // 工具开始运行
            if (payload.type === "tool_call") {
              // 如果是新工具，追加tools
              if (!updatedTools.find((t) => t.kind === payload.tool)) {
                updatedTools.push({
                  id: crypto.randomUUID(),
                  kind: payload.tool,
                  status: "running",
                  title: getToolTitle(payload.tool),
                });
              }
            }

            // 工具运行完成
            if (payload.type === "tool_result") {
              updatedTools = updatedTools.map((t) =>
                t.kind === payload.tool
                  ? {
                      ...t,
                      status: "success" as const,
                      title: getFinishToolTitle(payload.tool),
                    }
                  : t
              );
            }

            // 最终完成
            if (payload.type === "final") {
              const finalProfile = payload.profile;

              // 更新sessionList(全局：为了切换对话后依然能找到)
              setSessionList((prev) =>
                prev.map((s) =>
                  s._id === activeChatId ? { ...s, profile: finalProfile } : s
                )
              );

              // 更新Message (局部：为了即时渲染)
              return {
                ...msg,
                tools: updatedTools.map((t) => ({ ...t, status: "success" })),
                profile: finalProfile,
                isScanFinished: true,
              };
            }

            return { ...msg, tools: updatedTools };
          })
        );

        if (payload.type === "final") {
          es.close();
          return;
        }
      };

      es.onerror = (err) => {
        if (isDone) return;
        console.error("[SSE error]", err);
        es.close();
      }

      const getToolTitle = (toolKind: string) => {
        const mapping: any = {
          tool_detect_format: "正在检测数据格式...",
          tool_analyze_raster: "正在分析栅格数据...",
          tool_analyze_vector: "正在分析矢量数据...",
          tool_analyze_table: "正在分析表格数据...",
          tool_analyze_timeseries: "正在分析时间序列数据...",
          tool_analyze_parameter: "正在分析参数数据..."
        };
        return mapping[toolKind] || "正在处理数据...";
      };

      const getFinishToolTitle = (toolKind: string) => {
        const mapping: any = {
          tool_prepare_file: "数据扫描完成",
          tool_detect_format: "数据格式检测完成",
          tool_analyze_raster: "栅格数据分析完成",
          tool_analyze_vector: "矢量数据分析完成",
          tool_analyze_table: "表格数据分析完成",
          tool_analyze_timeseries: "时间序列数据分析完成",
          tool_analyze_parameter: "参数数据分析完成"
        };
        return mapping[toolKind];
      };
    } catch (error) {
      console.error("Error scanning data file:", error);
    }
  };

  // User click running button
  const handleRun = async () => {
    setIsRunning(true);
    dispatch({ type: "RESET" });
    const formData = new FormData();

    // 构造基础信息
    const modelRunInfo = {
      modelName: recommendedModelName,
      workflow: workflow,
    };
    formData.append("info", JSON.stringify(modelRunInfo));

    // 构造输入数据
    workflow.forEach((state) => {
      state.events.forEach((event) => {
        event.inputs.forEach((input) => {
          const value = uploadedData[input.name];
          if (value !== undefined && value !== null) {
            // 使用state@@@event@@@key方便后端拆解映射
            const fieldKey = `${state.stateName}@@@${event.eventName}@@@${input.name}@@@${input.type}`;

            if (value instanceof File) {
              formData.append(fieldKey, value);
            } else {
              formData.append(fieldKey, value.toString());
            }
          }
        });
      });
    });

    try {
      const response = await fetch(`${BACK_URL}/model/run`, {
        method: "POST",
        body: formData,
      });
      const responseData = await response.json();
      const result = responseData.result;
      console.log("Model run initiated, response:", result);

      const steps = [
        "Check data format",
        "Data preprocessing",
        "Model core computing",
        "Output result generation in progress",
      ];
      let i = 0;

      const executeStep = () => {
        if (i < steps.length) {
          console.log("i:", i);
          console.log("steps[i]:", steps[i]);

          // 使用dispatch进行同步更新
          dispatch({ type: "ADD_STEP", payload: steps[i] });

          i++;
          setTimeout(executeStep, 72000);
        } else {
          dispatch({ type: "ADD_STEP", payload: "Model execution finished!" });
        }
      };
      // 强制立即启动
      executeStep();
    } catch (error) {
      console.error("Error running model:", error);
    }
  };

  // 处理文件上传（同时触发数据扫描）
  const handleFileUploadWithScan = (slotId: string, file: File) => {
    setUploadedData((p) => ({
      ...p,
      [slotId]: file,
    }));
    handleDateScan(file);
  };

  const handleOpenConfig = () => {
    setIsConfigSidebarOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* ------------------------------- Left Sidebar ------------------------------- */}
        <aside className="w-72 bg-gray-900 text-white flex flex-col p-3">
          {}
          <div className="mb-5 space-y-2">
            <button
              className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
              onClick={() => resetToInitialState(false)}
            >
              <SquarePen size={20} />
              <span className="text-base">New Chat</span>
            </button>

            <button className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition">
              <Search size={20} />
              <span className="text-base">Search Chats</span>
            </button>
          </div>

          <h3 className="font-bold text-base text-gray-200 mb-2 px-2">
            Historical Records
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            {sessionList.map((session) => {
              const isActive = activeChatId === session._id;
              const isMenuOpen = openSessionMenuId === session._id;

              return (
                <div
                  key={session._id}
                  className={`group relative w-full flex items-center gap-2 p-2 rounded-lg transition ${
                    isActive
                      ? "bg-gray-100/50 text-white"
                      : "hover:bg-gray-700 text-white"
                  }`}
                >
                  <button
                    className="flex-1 text-left truncate"
                    onClick={() => {
                      isManualSwitch.current = true;
                      setActiveChatId(session._id);
                      setOpenSessionMenuId(null);
                    }}
                  >
                    <div className="text-base truncate w-full">
                      {session.title || "新对话"}
                    </div>
                  </button>

                  <button
                    className={`p-1 rounded hover:bg-gray-700 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isMenuOpen ? "opacity-100" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSessionMenuId((prev) =>
                        prev === session._id ? null : session._id,
                      );
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-2 top-11 z-10 bg-gray-900 text-sm text-white rounded-md shadow-lg border border-gray-700 min-w-[140px]">
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSession(
                            session._id,
                            session.title || "新对话",
                          );
                          setOpenSessionMenuId(null);
                        }}
                      >
                        重命名
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-800 text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session._id);
                          setOpenSessionMenuId(null);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ------------------------------- Main Content: Chat Flow ------------------------------- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 对话流容器 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full">
                <div className="text-center max-w-2xl">
                  <h2 className="text-3xl font-bold text-black mb-4">
                    👋 欢迎使用地理模拟智能决策平台
                  </h2>
                  <p className="text-gray-600 mb-8">
                    描述您的需求，我将为您推荐最合适的地理模型
                  </p>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    <button
                      onClick={() =>handleSendMessage("帮我预测2026-2030年中国环太湖流域省份的城市用地扩张情况")}
                      className="w-120 p-4 text-justify bg-blue-50 hover:from-blue-100 hover:to-purple-50 rounded-xl transition-all"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        帮我预测2026-2030年中国环太湖流域省份的城市用地扩张情况
                      </span>
                    </button>
                    <button
                      onClick={() =>handleSendMessage("帮我选择一个模型对街景影像进行分类")}
                      className="w-120 p-4 text-justify bg-blue-50 hover:from-blue-100 hover:to-purple-50 rounded-xl transition-all"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        帮我选择一个模型对街景影像进行分类
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto w-full">
                {/* 渲染所有消息 */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 max-w-[90%]">
                        {/* AI文本消息 */}
                        {msg.type === "text" && msg.content && (
                          <div className="bg-gray-100 px-5 py-4 rounded-2xl rounded-tl-sm">
                            <article className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </article>
                          </div>
                        )}

                        {/* 工具调用时间线 */}
                        {msg.type === "tool" && msg.tools && msg.tools.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <ToolTimeline msg={msg} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* 任务规格卡片 */}
                {currentTaskSpec && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%]">
                      <TaskSpecCard data={currentTaskSpec} />
                    </div>
                  </div>
                )}

                {/* 模型推荐卡片 + 配置按钮 */}
                {recommendedModelName && (
                  <div className="flex justify-start">
                    <div className="bg-linear-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 max-w-[90%] shadow-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Sparkles className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-blue-900 mb-1">
                            推荐模型
                          </h3>
                          <p className="text-2xl font-extrabold text-blue-800">
                            {recommendedModelName}
                          </p>
                          {recommendedModelDesc && (
                            <p className="text-sm text-gray-700 mt-2">
                              {recommendedModelDesc}
                            </p>
                          )}
                        </div>
                      </div>

                      {!isRunning && workflow.length > 0 && modelContract && (
                        <button
                          onClick={handleOpenConfig}
                          className="w-full py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Settings size={20} />
                          <span>配置模型</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 运行结果 */}
                {isRunning && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-[90%] shadow-lg w-full">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        🚀 模型执行中
                      </h3>
                      <ModelExecuteProcess status={runStatus} />

                      <button
                        onClick={() => resetToInitialState(true)}
                        className="mt-4 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        重新配置
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部输入框 */}
          <ChatInput onSend={(msg) => handleSendMessage(msg)} />
        </main>
      </div>

      {/* ------------------------------- Right Configuration Sidebar ------------------------------- */}
      <ConfigurationSidebar
        isOpen={isConfigSidebarOpen}
        onClose={() => setIsConfigSidebarOpen(false)}
        modelName={recommendedModelName || ""}
        modelContract={modelContract}
        workflow={workflow}
        uploadedData={uploadedData}
        messages={messages}
        onDataChange={(key, value) => {
          setUploadedData((p) => ({
            ...p,
            [key]: value,
          }));
        }}
        onFileUpload={handleFileUploadWithScan}
        onRunModel={handleRun}
        isRunning={isRunning}
        runStatus={runStatus}
      />
    </div>
  );
}
