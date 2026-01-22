import React, { useState } from "react";
import ChatInput from "../components/ChatInput";
import { SquarePen, Search, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModelExecuteProcess from "../components/ModelExecuteProcess";
import ToolTimeline from "../components/ToolTimeline";
import type { WorkflowState, Message} from "../types";

// 后端API基础URL
const BACK_URL = import.meta.env.VITE_BACK_URL;

// Reducer Action Types
type Action = { type: "ADD_STEP"; payload: string } | { type: "RESET" };

function runStatusReducer(state: String[], action: Action): String[] {
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

  // 推荐的模型信息
  const [reconmmendedModelName, setReconmmendedModelName] = useState<
    string | null
  >(null);
  const [reconmmendedModelDesc, setReconmmendedModelDesc] = useState<
    string | null
  >(null);
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
  // 记录当前操作是用户从左侧列表点击切换还是发送一条消息时自动创建新对话
  const isManualSwitch = React.useRef(false);

  // 定义初始状态或使用重置函数
  const resetToInitialState = (keepSessionId: boolean = false) => {
    setMessages([]);
    setReconmmendedModelName(null);
    setReconmmendedModelDesc(null);
    setWorkflow([]);
    setUploadedData({});
    setIsRunning(false);
    dispatch({ type: "RESET" });

    if (!keepSessionId) {
      setActiveChatId(null);
      isManualSwitch.current = false;
    }
  };

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

  // 处理对话切换或者初始化
  React.useEffect(() => {
    // 如果没有ID或者是发送消息时自动设置的ID，则不触发历史加载
    if (!activeChatId || !isManualSwitch.current) return;

    resetToInitialState(true);

    const currentSession = sessionList.find((s) => s._id === activeChatId);
    if (currentSession?.recommendedModel) {
      setReconmmendedModelName(currentSession.recommendedModel.name);
      setReconmmendedModelDesc(currentSession.recommendedModel.description);
      setWorkflow(currentSession.recommendedModel.workflow);
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
                    t.type === "search_index_end"
                      ? "指标库检索完成"
                      : t.type === "search_model_end"
                      ? "模型库检索完成"
                      : t.type === "model_details_end"
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
    setReconmmendedModelName(null);
    setReconmmendedModelDesc(null);
    setWorkflow([]);
    dispatch({ type: "RESET" });
    setIsRunning(false);

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
                      title: getFinishToolTitle(payload.tool),
                      result: payload.data,
                    }
                  : t
              );
            }

            // 模型详情推荐
            if (payload.type === "tool_result" && payload.tool === "get_model_details") {
              setReconmmendedModelName(payload.data?.name ?? "");
              setReconmmendedModelDesc(payload.data?.description ?? "");
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

            // 最终完成
            if (payload.type === "final") {
              const taskSpec = payload.Task_spec;
              console.log("Final Task Spec:", taskSpec);
              es.close();
            }

            return { ...msg, tools: updatedTools };
          });

        });
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
        get_model_details: "正在读取模型工作流详情...",
      };
      return mapping[toolKind] || "正在处理...";
    };

    const getFinishToolTitle = (toolKind: string) => {
      const mapping: any = {
        search_relevant_indices: "指标库检索完成",
        search_relevant_models: "模型库检索完成",
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

  // 用于检查所有输入数据是否已经填写完整
  const isAllInputsFilled = () => {
    const allKeys: string[] = [];
    workflow.forEach((state) => {
      state.events.forEach((event) => {
        event.inputs.forEach((input) => {
          allKeys.push(input.name);
        });
      });
    });

    return (
      allKeys.length > 0 &&
      allKeys.every(
        (key) => uploadedData[key] !== undefined && uploadedData[key] !== null
      )
    );
  };

  // User clik running button
  const handleRun = async () => {
    setIsRunning(true);
    dispatch({ type: "RESET" });
    const formData = new FormData();

    // 构造基础信息
    const modelRunInfo = {
      modelName: reconmmendedModelName,
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

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* ------------------------------- Left Sidebar ------------------------------- */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col p-3">
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
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sessionList.map((session) => (
            <button
              key={session._id}
              className={`w-full text-left p-2 rounded-lg transition ${
                activeChatId === session._id
                  ? "bg-gray-100/50 text-white"
                  : "hover:bg-gray-700 text-white"
              }`}
              onClick={() => {
                isManualSwitch.current = true;
                setActiveChatId(session._id);
              }}
            >
              <div className="text-base truncate w-full">
                {session.title || "新对话"}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ------------------------------- Middle Chat Panel ------------------------------- */}
      <main className="flex flex-1 flex-col min-w-[400px]">
        <div
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto bg-white min-h-0"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full">
              <p className="text-gray-400 text-center text-base">
                👋 Enter your instructions to start the decision process
                <br />
                (example: help me predict land use change)
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              {/* 用户消息 + LLM回答 */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex flex-col space-y-2 max-w-[85%]">
                    {/* 渲染：用户消息 */}
                    {msg.role === "user" && (
                      <div className="p-3 rounded-lg bg-gray-200/50 text-black rounded-tr-none self-end">
                        <p className="text-base">{msg.content}</p>
                      </div>
                    )}

                    {/* 渲染AI消息区域 */}
                    {msg.role === "AI" && (
                      <div className="flex flex-col space-y-2 w-full max-w-4xl">
                        {/* 渲染：AI 工具块 */}
                        {msg.tools?.length && (
                          <div className="self-start w-full">
                            <div className="p-2 rounded-lg shadow-lg bg-blue-100/20 border border-blue-500 md:w-[800px]">
                              <ToolTimeline msg={msg} />
                            </div>
                          </div>
                        )}

                        {/* 渲染：AI 文本块 */}
                        {msg.content && (
                          <div className="p-2 text-black w-full">
                            <p className="text-base whitespace-pre-wrap wrap-break-word">
                              {msg.content}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="h-4" />
            </div>
          )}
        </div>

        <ChatInput onSend={(msg) => handleSendMessage(msg)} />
      </main>

      {/* ------------------------------- Right InputSlots + Result Panel ------------------------------- */}
      {/* Now, LLM don't recommend any model —— reconmmendedModelName: false; isRunning: false */}
      <AnimatePresence>
        {reconmmendedModelName && (
          <motion.section
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex-none w-full md:w-[35%] lg:w-[30%] min-w-[320px] max-w-[600px] flex flex-col overflow-y-auto"
          >
            <div className="flex-1 bg-gray-100/50 rounded-lg my-5 mr-5 p-4 shadow">
              {/* Now, LLM has recommend the most suitable model, and user needs to upload data */}
              {reconmmendedModelName && !isRunning && (
                <div className="flex-1 custom-scrollbar">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Sparkles size={20} className="text-blue-800" />
                      <h3 className="text-3xl text-blue-800 font-bold">
                        Model recommendation
                      </h3>
                    </div>
                    <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>

                    <p className="text-2xl text-blue-800 font-extrabold">
                      {reconmmendedModelName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {reconmmendedModelDesc}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 mb-5">
                    {workflow.map((state, sIdx) => (
                      <div
                        key={`state-${state.stateName}-${sIdx}`}
                        className="relative ml-2 pl-4 pb-2 border-l-2 border-blue-200"
                      >
                        {/* state层 */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                        <div className="mb-3">
                          <h4 className="text-xl font-bold text-black">
                            {state.stateName}
                          </h4>
                          {state.stateDescription && (
                            <p className="text-sm text-gray-500">
                              {state.stateDescription}
                            </p>
                          )}
                        </div>

                        {/* event层 */}
                        <div className="space-y-3">
                          {state.events.map((event, eIdx) => (
                            <div
                              key={`event-${state.stateName}-${event.eventName}-${eIdx}`}
                              className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <div className="w-1 h-3 bg-blue-400 rounded-full" />
                                <h5 className="text-lg font-semibold text-gray-800">
                                  {event.eventName}
                                </h5>
                              </div>
                              {event.eventDescription && (
                                <p className="mb-2 text-sm text-gray-500">
                                  {event.eventDescription}
                                </p>
                              )}

                              {/* input层 */}
                              <div className="space-y-3">
                                {event.inputs.map((input, iIdx) => {
                                  const value = uploadedData[input.name];
                                  const isFile =
                                    input.type.toUpperCase() === "FILE";

                                  return (
                                    <div
                                      key={`input-${state.stateName}-${event.eventName}-${input.name}-${iIdx}`}
                                      className="flex flex-col gap-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        {isFile ? (
                                          <div className="flex items-center gap-2 w-full">
                                            <label className="shrink-0 cursor-pointer flex justify-center items-center h-8 px-3 bg-gray-100 hover:bg-blue-50 text-blue-600 border border-dashed border-blue-300 rounded-md text-sm transition-all">
                                              {value
                                                ? "Reupload"
                                                : "Select File"}
                                              <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    setUploadedData((p) => ({
                                                      ...p,
                                                      [input.name]:
                                                        e.target.files?.[0] ||
                                                        null,
                                                    }));

                                                    handleDateScan(file);
                                                  }
                                                }}
                                              />
                                            </label>
                                            <span className="text-xs truncate text-gray-400">
                                              {value instanceof File
                                                ? value.name
                                                : "No data detected !"}
                                            </span>
                                          </div>
                                        ) : (
                                          <input
                                            className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 transition-colors text-black"
                                            placeholder={`${input.description}`}
                                            onChange={(e) =>
                                              setUploadedData((p) => ({
                                                ...p,
                                                [input.name]: e.target.value,
                                              }))
                                            }
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={!isAllInputsFilled()}
                    onClick={handleRun}
                    className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-2 text-base"
                  >
                    Running
                  </button>
                </div>
              )}

              {/* Now, LLM has recommend the most suitable model, and user has uploaded data */}
              {reconmmendedModelName && isRunning && (
                <div className="space-y-3">
                  <div className="w-full flex items-center space-x-2">
                    <Activity size={20} className="text-blue-800" />
                    <h3 className="text-3xl text-blue-800 font-bold">
                      Model execution process
                    </h3>
                  </div>
                  <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-gray-900 via-gray-500 to-transparent"></div>

                  <div className="flex-1 overflow-y-auto pr-2">
                    <ModelExecuteProcess status={runStatus} />
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
