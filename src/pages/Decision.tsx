import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, useParams } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import { Earth, SquarePen, Search, Sparkles, Activity, MoreVertical, Info, Copy, Check, ScanSearch, Play, Columns2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModelExecuteProcess from "../components/ModelExecuteProcess";
import ToolTimeline from "../components/ToolTimeline";
import { FinalProfileCard } from "../components/ToolTimeline";
import type { WorkflowState, Message} from "../types";
import TaskSpecCard from "../components/TaskSpecCard";
import { RequirementTooltip, type ModelContractItem } from "../components/ModelContract";
import MapboxViewer from "../components/mapbox";
import { isModelFavorited, toggleFavoriteModel } from "../lib/userCenter.ts";

// 后端API基础URL
const BACK_URL = import.meta.env.VITE_BACK_URL;
const DECISION_SESSION_STATE_STORAGE_KEY = "geoagent_decision_session_state";

type DecisionSessionState = {
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

const loadDecisionSessionStates = (): Record<string, DecisionSessionState> => {
  try {
    const raw = localStorage.getItem(DECISION_SESSION_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const persistDecisionSessionState = (sessionId: string, state: DecisionSessionState) => {
  try {
    const allStates = loadDecisionSessionStates();
    allStates[sessionId] = state;
    localStorage.setItem(DECISION_SESSION_STATE_STORAGE_KEY, JSON.stringify(allStates));
  } catch (error) {
    console.error("Persist decision session state failed", error);
  }
};

export default function IntelligentDecision() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const copyResetTimerRef = React.useRef<number | null>(null);

  // 当前任务需求
  const [currentTaskSpec, setCurrentTaskSpec] = useState<any | null>(null);
  // 当前推荐模型要求
  const [modelContract, setModelContract] = useState<any | null>(null);

  // 推荐的模型信息
  const [recommendedModelName, setRecommendedModelName] = useState<string | null>(null);
  const [recommendedModelDesc, setRecommendedModelDesc] = useState<string | null>(null);
  const [isRecommendedModelFavorited, setIsRecommendedModelFavorited] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowState[]>([]);

  // 扫描数据状态
  const [isScanning, setIsScanning] = useState(false);

  // 用户上传的数据
  const [uploadedData, setUploadedData] = useState<Record<string, File | string | number | null>>({});
  // 转换后的数据
  const [convertedData, setConvertedData] = useState<Record<string, any>>({});

  // 已上传的文件列表（带元数据）
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; file: File; inputName: string }>>([]);

  // 扫描结果存储
  const [scanResults, setScanResults] = useState<Record<string, any>>({});

  // 扫描结果模态窗口
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedScanFile, setSelectedScanFile] = useState<string | null>(null);
  const [isAligning, setIsAligning] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<any | null>(null);

  const isNoGoAlignment =
    !!alignmentResult &&
    (
      alignmentResult.go_no_go === "no-go" ||
      alignmentResult.alignment_status === "mismatch" ||
      alignmentResult.can_run_now === false ||
      (Array.isArray(alignmentResult.blocking_issues) &&
        alignmentResult.blocking_issues.length > 0)
    );

  // 模型运行状态
  const [isRunning, setIsRunning] = useState(false);
  // @ts-ignore - taskId is stored for potential future use (debugging, recovery)
  const [modelTaskId, setModelTaskId] = useState<string | null>(null);
  const [modelTaskStatus, setModelTaskStatus] = useState<string>('idle'); // idle, running, completed, failed
  const [modelRunResult, setModelRunResult] = useState<any | null>(null);
  const [modelRunError, setModelRunError] = useState<string | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<"form" | "execution">("form");
  const statusCheckIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const isHydratingSessionRef = React.useRef(false);

  // 设置对话列表状态
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null,);
  // 记录当前操作是用户从左侧列表点击切换还是发送一条消息时自动创建新对话
  const isManualSwitch = React.useRef(false);

  // 定义初始状态或使用重置函数
  const resetToInitialState = (keepSessionId: boolean = false) => {
    setMessages([]);
    setRecommendedModelName(null);
    setRecommendedModelDesc(null);
    setWorkflow([]);
    setUploadedData({});
    setIsRunning(false);
    setModelTaskId(null);
    setModelTaskStatus('idle');
    setModelRunResult(null);
    setModelRunError(null);
    setRightPanelMode("form");
    setCurrentTaskSpec(null);
    setModelContract(null);
    setAlignmentResult(null);

    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

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

  React.useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!recommendedModelName) {
      setIsRecommendedModelFavorited(false);
      return;
    }

    let cancelled = false;
    isModelFavorited(recommendedModelName)
      .then((favorited: boolean) => {
        if (!cancelled) setIsRecommendedModelFavorited(favorited);
      })
      .catch(() => {
        if (!cancelled) setIsRecommendedModelFavorited(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recommendedModelName]);

  const handleToggleRecommendedModelFavorite = async () => {
    if (!recommendedModelName) return;

    const favorited = await toggleFavoriteModel({
      name: recommendedModelName,
      description: recommendedModelDesc || "",
      source: "ai-recommendation",
    });

    setIsRecommendedModelFavorited(favorited);
    alert(favorited ? "已收藏该推荐模型" : "已取消收藏该推荐模型");
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!success) {
      throw new Error("Clipboard unavailable");
    }
  };

  const getMessageCopyText = (msg: Message) => {
    const parts: string[] = [];
    const textContent = msg.content?.trim();

    if (textContent) {
      parts.push(textContent);
    }

    if (Array.isArray(msg.tools) && msg.tools.length > 0) {
      const toolText = msg.tools
        .map((tool, index) => {
          const title = tool.title || tool.kind || `工具${index + 1}`;
          const resultText =
            typeof tool.result === "string"
              ? tool.result
              : JSON.stringify(tool.result ?? {}, null, 2);
          return `${title}\n${resultText}`;
        })
        .join("\n\n");
      parts.push(toolText);
    }

    return parts.join("\n\n").trim();
  };

  const handleCopyMessage = async (msg: Message) => {
    const text = getMessageCopyText(msg);
    if (!text) return;

    try {
      await copyTextToClipboard(text);
      setCopiedMessageId(msg.id);

      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedMessageId(null);
      }, 1500);
    } catch (err) {
      console.error("Copy message failed", err);
      alert("复制失败，请检查浏览器剪贴板权限");
    }
  };

  // 处理对话切换或者初始化
  React.useEffect(() => {
    // 如果没有ID或者是发送消息时自动设置的ID，则不触发历史加载
    if (!activeChatId || !isManualSwitch.current) return;

    isHydratingSessionRef.current = true;
    resetToInitialState(true);

    const currentSession = sessionList.find((s) => s._id === activeChatId);
    const persistedState = loadDecisionSessionStates()[activeChatId];

    if (currentSession?.recommendedModel) {
      setRecommendedModelName(currentSession.recommendedModel.name);
      setRecommendedModelDesc(currentSession.recommendedModel.description);
      setWorkflow(currentSession.recommendedModel.workflow);
      setCurrentTaskSpec(currentSession.taskSpec || null);
      setModelContract(currentSession.modelContract || null);
    }

    if (persistedState) {
      setRecommendedModelName(persistedState.recommendedModelName);
      setRecommendedModelDesc(persistedState.recommendedModelDesc);
      setWorkflow(persistedState.workflow || []);
      setCurrentTaskSpec(persistedState.currentTaskSpec || null);
      setModelContract(persistedState.modelContract || null);
      setModelTaskId(persistedState.modelTaskId || null);
      setModelTaskStatus(persistedState.modelTaskStatus || "idle");
      setModelRunResult(persistedState.modelRunResult || null);
      setModelRunError(persistedState.modelRunError || null);
      setRightPanelMode(persistedState.rightPanelMode || "form");
      setIsRunning(persistedState.modelTaskStatus === "running");
    }

    // 模型输入参数只在当前连续对话流程中保留，不跨会话与刷新恢复。
    setUploadedData({});
    setUploadedFiles([]);
    setConvertedData({});
    setScanResults({});
    setAlignmentResult(null);

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
      })
      .finally(() => {
        isHydratingSessionRef.current = false;

        if (persistedState?.modelTaskId && persistedState.modelTaskStatus === "running") {
          pollTaskStatus(persistedState.modelTaskId);
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
          }
          statusCheckIntervalRef.current = setInterval(() => {
            pollTaskStatus(persistedState.modelTaskId as string);
          }, 2000);
        }

        if (
          persistedState?.modelTaskId &&
          persistedState.modelTaskStatus === "completed" &&
          !persistedState.modelRunResult
        ) {
          pollTaskStatus(persistedState.modelTaskId);
        }
      });
  }, [activeChatId]);

  React.useEffect(() => {
    if (!activeChatId || isHydratingSessionRef.current) return;

    persistDecisionSessionState(activeChatId, {
      recommendedModelName,
      recommendedModelDesc,
      workflow,
      currentTaskSpec,
      modelContract,
      modelTaskId,
      modelTaskStatus,
      modelRunResult,
      modelRunError,
      rightPanelMode,
    });
  }, [
    activeChatId,
    recommendedModelName,
    recommendedModelDesc,
    workflow,
    currentTaskSpec,
    modelContract,
    modelTaskId,
    modelTaskStatus,
    modelRunResult,
    modelRunError,
    rightPanelMode,
  ]);

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

  React.useEffect(() => {
    if (!routeSessionId) {
      if (activeChatId) {
        setActiveChatId(null);
        isManualSwitch.current = false;
      }
      return;
    }

    if (routeSessionId !== activeChatId) {
      isManualSwitch.current = true;
      setActiveChatId(routeSessionId);
    }
  }, [routeSessionId, activeChatId]);

  // 重命名会话
  const handleRenameSession = async (
    sessionId: string,
    currentTitle: string,
  ) => {
    const newTitle = window.prompt(
      "Rename session",
      currentTitle || "New Chat",
    );
    if (!newTitle || newTitle.trim() === currentTitle) return;

    const title = newTitle.trim();
    const prev = sessionList;
    setSessionList((p) =>
      p.map((s) => (s._id === sessionId ? { ...s, title } : s)),
    );

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
      navigate("/decision");
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
          navigate(`/decision/${currentSessionId}`);
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
    setIsRunning(false);
    setModelTaskId(null);
    setModelTaskStatus('idle');
    setModelRunResult(null);
    setModelRunError(null);
    setRightPanelMode("form");
    setCurrentTaskSpec(null);
    setModelContract(null);

    // 建立 SSE 连接（Node → Python → Agent）
    const es = new EventSource(
      `${BACK_URL}/chat/sessions/${currentSessionId}/chat?query=${encodeURIComponent(
        prompt,
      )}`,
      { withCredentials: true }
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
                      type: "tool",
                      title: getFinishToolTitle(payload.tool),
                      result: payload.data,
                    }
                  : t,
              );
            }

            // 最终完成
            if (payload.type === "final") {
              es.close();
            }

            return { ...msg, tools: updatedTools };
          });
        });

        if (
          payload.type === "tool_result" &&
          payload.tool === "get_model_details"
        ) {
          setRecommendedModelName(payload.data?.name ?? "");
          setRecommendedModelDesc(payload.data?.description ?? "");
          setWorkflow(payload.data?.workflow ?? []);
          setIsRunning(false);

          setSessionList((prev) =>
            prev.map((s) =>
              s._id === currentSessionId
                ? {
                    ...s,
                    recommendedModel: {
                      status: "success",
                      name: payload.data?.name ?? "",
                      md5: payload.data?.md5 ?? "",
                      description: payload.data?.description ?? "",
                      workflow: payload.data?.workflow ?? [],
                    },
                  }
                : s,
            ),
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

  // 批量扫描已上传的文件（用于模态窗口）
  const handleBatchScan = async () => {
    if (!activeChatId || uploadedFiles.length === 0) {
      console.error("No session or files to scan");
      return;
    }

    setIsScanning(true);
    setAlignmentResult(null);

    try {
      // 逐个扫描每个上传的文件
      for (let idx = 0; idx < uploadedFiles.length; idx++) {
        const { name, file } = uploadedFiles[idx];
        const forData = new FormData();
        forData.append("file", file);
        forData.append("sessionId", activeChatId);

        const uploadRes = await fetch(`${BACK_URL}/data/uploadAndConvert`, {
          method: "POST",
          body: forData,
        });
        const uploadData = await uploadRes.json();
        setConvertedData((prev) => ({ ...prev, [name]: uploadData }));

        if (!uploadData.success) {
          console.error(`文件 ${name} 上传失败`);
          continue;
        }

        const serverFilePath = uploadData.filePath;
        const slotKey = uploadedFiles[idx].inputName;
        const fileKey = `${name}-${idx}`;
        const params = new URLSearchParams({
          filePath: serverFilePath,
          slotKey: slotKey
        });

        // 发起扫描请求
        const es = new EventSource(
          `${BACK_URL}/data-mapping/sessions/${activeChatId}/data-scan?${params.toString()}`,
          { withCredentials: true }
        );

        // 收集该文件的扫描结果
        let fileResult: any = {
          tools: [],
          profile: null,
        };

        await new Promise<void>((resolve) => {
          es.onmessage = (e) => {
            if (!e.data) return;

            const payload = JSON.parse(e.data);

            if (payload.type === "tool_call") {
              fileResult.tools.push({
                tool: payload.tool,
                status: "running",
              });
            }

            if (payload.type === "tool_result") {
              fileResult.tools = fileResult.tools.map((t: any) =>
                t.tool === payload.tool
                  ? { ...t, status: "success", data: payload.data }
                  : t,
              );
            }

            if (payload.type === "error") {
              console.error(
                `后端扫描任务报错: ${payload.message || "未知错误"}`,
              );
              es.close();
              resolve();
            }

            if (payload.type === "final") {
              fileResult.profile = payload.profile;
              es.close();
              resolve();
            }
          };

          es.onerror = () => {
            es.close();
            resolve();
          };
        });

        // 保存结果到 scanResults
        setScanResults((prev) => ({
          ...prev,
          [fileKey]: fileResult,
        }));
      }
    } catch (error) {
      console.error("Batch scan error:", error);
    } finally {
      setIsScanning(false);
      // 扫描完成后，自动打开结果模态窗口并选中第一个文件
      if (uploadedFiles.length > 0) {
        setSelectedScanFile(`${uploadedFiles[0].name}-0`);
        setShowScanModal(true);
      }
    }
  };

  // 对齐功能：调用后端align-session
  const handleAlign = async () => {
    if (!activeChatId) {
      console.error("No session to align");
      return;
    }

    setIsAligning(true);
    try {
      // 调用POST接口，优先按SSE流式返回解析
      const alignResponse = await fetch(
        `${BACK_URL}/chat/sessions/${activeChatId}/align`,
        {
          method: "POST",
          headers: {
            Accept: "text/event-stream, application/json",
          },
        }
      );

      if (!alignResponse.ok) {
        throw new Error(`Align failed with status ${alignResponse.status}`);
      }

      let alignData: any = null;
      const contentType = alignResponse.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        if (!alignResponse.body) {
          throw new Error("Align stream body is empty");
        }

        const reader = alignResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalPayload: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (true) {
            const nn = buffer.indexOf("\n\n");
            const rrnn = buffer.indexOf("\r\n\r\n");
            const sepIndex =
              nn === -1 ? rrnn : rrnn === -1 ? nn : Math.min(nn, rrnn);
            if (sepIndex < 0) {
              break;
            }

            const block = buffer.slice(0, sepIndex);
            const sepLen = buffer.startsWith("\r\n", sepIndex) ? 4 : 2;
            buffer = buffer.slice(sepIndex + sepLen);

            const dataLines: string[] = [];
            block.split(/\r?\n/).forEach((rawLine) => {
              const line = rawLine.trim();
              if (!line) return;
              if (line.startsWith("data:")) {
                dataLines.push(line.replace(/^data:\s*/, ""));
              }
            });

            if (!dataLines.length) {
              continue;
            }

            const jsonStr = dataLines.join("\n");
            let payload: any;
            try {
              payload = JSON.parse(jsonStr);
            } catch (err) {
              console.warn("align SSE JSON parse warning:", err);
              continue;
            }

            if (payload?.type === "error") {
              throw new Error(payload?.message || "Align stream error");
            }

            if (payload?.type === "final") {
              finalPayload = payload?.data ?? payload;
            }
          }
        }

        if (!finalPayload) {
          throw new Error("Align stream ended without final payload");
        }

        alignData = finalPayload;
      } else {
        // 兼容非SSE返回
        alignData = await alignResponse.json();
      }

      console.log("Alignment response:", alignData);

      const normalizeDecision = (value: any): "go" | "no-go" | undefined => {
        if (typeof value !== "string") return undefined;
        const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
        if (["no-go", "nogo", "mismatch", "blocked", "block", "fail", "failed"].includes(normalized)) {
          return "no-go";
        }
        if (["go", "ok", "pass", "match", "partial"].includes(normalized)) {
          return "go";
        }
        return undefined;
      };

      const resultRoot = alignData?.data ?? alignData;
      const alignment_result =
        resultRoot?.alignment_result && typeof resultRoot.alignment_result === "object"
          ? { ...resultRoot.alignment_result }
          : null;

      if (!alignment_result) {
        throw new Error("Invalid alignment result payload");
      }

      const hasBlockingIssues =
        Array.isArray(alignment_result.blocking_issues) &&
        alignment_result.blocking_issues.length > 0;

      const decisionFromFlags =
        hasBlockingIssues ||
        alignment_result.can_run_now === false ||
        normalizeDecision(resultRoot?.alignment_status ?? alignment_result.alignment_status) === "no-go";

      const normalizedDecision =
        normalizeDecision(resultRoot?.go_no_go ?? alignment_result.go_no_go) ??
        (decisionFromFlags ? "no-go" : "go");

      if (normalizedDecision === "no-go") {
        alignment_result.go_no_go = "no-go";
        alignment_result.can_run_now = false;
      } else {
        alignment_result.go_no_go = "go";
      }
      console.log("✅ Normalized alignment result:", alignment_result);

      setAlignmentResult(alignment_result);
    } catch (error) {
      alert(`对齐失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsAligning(false);
    }
  };

  const handleMapping = () => {
    alert("当前为占位按钮：后续将在这里接入后端映射接口，将用户数据转换为模型需求数据。");
  };

  // 更新当前模型输入数据
  const handleInputChange = async(name: string, value: string) => {
    setUploadedData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const updates = {
      [`context.${name}`]: value,
    };
    // 调用GET接口读取持久化字段，刷新前端状态
      const sessionResponse = await fetch(
        `${BACK_URL}/chat/sessions/${activeChatId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error(`Fetch session failed with status ${sessionResponse.status}`);
      }

      await sessionResponse.json();
  }

  // 右侧面板滚动引用
  const rightPanelScrollRef = React.useRef<HTMLDivElement>(null);

  // 获取所有需要显示的数据
  const getAllGeoJsonDataForMap = useMemo(() => {
    const allData: any[] = [];

    uploadedFiles.forEach((file) => {
      if (convertedData[file.name]) {
        allData.push({
          name: file.name,
          data: convertedData[file.name],
        });
      }
    });

    return allData;
  }, [uploadedFiles, convertedData]);

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
        (key) => uploadedData[key] !== undefined && uploadedData[key] !== null,
      )
    );
  };

  // 轮询获取任务状态
  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`${BACK_URL}/model/status/${taskId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to get task status");
      }

      const statusPayload = data.data;

      // 后端约定：轮询直到 status === "Finished"
      const currentStatus =
        typeof statusPayload === "string"
          ? statusPayload
          : statusPayload?.status ?? "Running";

      if (currentStatus === "Finished") {
        setModelTaskStatus('completed');
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }

        // 获取最终结果
        try {
          const resultResponse = await fetch(`${BACK_URL}/model/result/${taskId}`);
          const resultData = await resultResponse.json();

          if (resultData.success) {
            // 后端约定：输出在 data.result 中（每项包含 url）
            setModelRunResult(resultData.data ?? null);
            setRightPanelMode("execution");
          } else {
            throw new Error(resultData.message || "Failed to get result");
          }
        } catch (resultError) {
          console.error("Error fetching result:", resultError);
          setModelTaskStatus('failed');
          setModelRunError((resultError instanceof Error ? resultError.message : "Failed to fetch result"));
        }
      } else if (currentStatus === "Failed" || currentStatus === "Error") {
        console.error("Task execution failed with status:", currentStatus, "details:", statusPayload);
        setModelTaskStatus('failed');
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        setModelRunError(statusPayload?.error || "Task execution failed");
      } else {
        // 其余状态继续轮询
        setModelTaskStatus('running');
      }
    } catch (error) {
      console.error("Error polling task status:", error);
      setModelTaskStatus('failed');
      setModelRunError(error instanceof Error ? error.message : "Failed to check task status");
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    }
  };

  // 运行模型：发布任务，然后轮询状态直到完成
  const handleRun = async () => {
    setIsRunning(true);
    setModelTaskId(null);
    setModelTaskStatus('running');
    setModelRunResult(null);
    setModelRunError(null);
    setRightPanelMode("execution");

    // 自动滚动右侧面板到顶部，显示执行状态
    if (rightPanelScrollRef.current) {
      setTimeout(() => {
        rightPanelScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }

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
      if (!response.ok) {
        throw new Error(responseData?.message || `Request failed: ${response.status}`);
      }

      const taskId = responseData.data?.taskId;
      if (!taskId) {
        throw new Error("No taskId returned from backend");
      }

      setModelTaskId(taskId);
      setModelTaskStatus('running');
      setIsRunning(false);
      setRightPanelMode("execution");

      if (activeChatId) {
        persistDecisionSessionState(activeChatId, {
          recommendedModelName,
          recommendedModelDesc,
          workflow,
          currentTaskSpec,
          modelContract,
          modelTaskId: taskId,
          modelTaskStatus: "running",
          modelRunResult: null,
          modelRunError: null,
          rightPanelMode: "execution",
        });
      }

      // 先立即检查一次，避免已经完成但UI还在等待
      pollTaskStatus(taskId);

      // 开始轮询任务状态（每2秒检查一次）
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      statusCheckIntervalRef.current = setInterval(() => {
        pollTaskStatus(taskId);
      }, 2000);
    } catch (error) {
      console.error("Error running model:", error);
      setModelRunError(error instanceof Error ? error.message : "Task publish failed, please retry.");
      setIsRunning(false);
      setModelTaskStatus('failed');

      if (activeChatId) {
        persistDecisionSessionState(activeChatId, {
          recommendedModelName,
          recommendedModelDesc,
          workflow,
          currentTaskSpec,
          modelContract,
          modelTaskId: null,
          modelTaskStatus: "failed",
          modelRunResult: null,
          modelRunError: error instanceof Error ? error.message : "Task publish failed, please retry.",
          rightPanelMode: "execution",
        });
      }
    }
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* ------------------------------- Left Sidebar ------------------------------- */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col p-3">
        <div className="mb-5 space-y-2">
          <button
            className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
            onClick={() => {
              resetToInitialState(false);
              navigate("/decision");
            }}
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
        <div className="flex-1 overflow-y-auto space-y-2 pr-1
          [scrollbar-color:transparent_transparent] hover:[scrollbar-color:#4b5563_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
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
                    navigate(`/decision/${session._id}`);
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

      {/* ------------------------------- Middle Chat Panel ------------------------------- */}
      <main className="flex flex-1 flex-col min-w-[350px]">
        <div
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto bg-white min-h-0 [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent]
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-200/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/60
            [&::-webkit-scrollbar-thumb]:rounded-full"
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
                  className={`group flex ${
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

                    {(() => {
                      const canCopy = getMessageCopyText(msg).length > 0;
                      const copied = copiedMessageId === msg.id;

                      return (
                        <button
                          type="button"
                          disabled={!canCopy}
                          onClick={() => handleCopyMessage(msg)}
                          className={`inline-flex items-center gap-1 text-xs ${msg.role === "user" ? "self-end" : "self-start"} transition-all duration-150 ${copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${
                            canCopy
                              ? "text-gray-600 hover:text-gray-900"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                          aria-label="复制消息"
                          title={canCopy ? "复制消息" : "暂无可复制内容"}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied ? "已复制" : "复制"}</span>
                        </button>
                      );
                    })()}

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
                          <div className="p-4 text-black w-full">
                            {/* 添加 prose 系列类名 */}
                            <article
                              className="prose prose-slate max-w-none
                                prose-headings:font-bold
                                prose-h2:mt-8 prose-h2:mb-4
                                prose-h3:mt-6
                                prose-p:text-gray-800
                                prose-strong:text-black
                                marker:text-black marker:font-semibold
                                prose-table:border prose-table:rounded-xl
                                prose-code:before:content-none prose-code:after:content-none
                                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                                prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                                prose-pre:text-sm prose-pre:text-gray-800"
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </article>
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
      {/* Now, LLM don't recommend any model —— recommendedModelName: false; isRunning: false */}
      <AnimatePresence>
        {(recommendedModelName || currentTaskSpec) && (
          <motion.section
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex-none w-full md:w-[45%] lg:w-[40%] min-w-[320px] max-w-[750px] flex flex-col overflow-y-auto
            [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent]
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-200/50
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/60
            [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <div
              className="flex-1 overflow-y-auto p-5 custom-scrollbar"
              ref={rightPanelScrollRef}
            >
              {currentTaskSpec && (
                <div className="mb-8">
                  <TaskSpecCard data={currentTaskSpec} />
                </div>
              )}

              {recommendedModelName && (
                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Columns2 size={14} />
                      <span>面板视图</span>
                    </div>
                    {rightPanelMode === "execution" ? (
                      <button
                        onClick={() => setRightPanelMode("form")}
                        className="px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-500 transition"
                      >
                        查看输入表单
                      </button>
                    ) : (
                      <button
                        onClick={() => setRightPanelMode("execution")}
                        disabled={
                          modelTaskStatus === "idle" &&
                          !modelRunResult &&
                          !modelRunError
                        }
                        className="px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-500 transition"
                      >
                        查看模型执行
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 运行态/结果态：直接显示模型执行状态和结果 */}
              {recommendedModelName && rightPanelMode === "execution" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity size={20} className="text-blue-800" />
                    <h3 className="text-2xl text-blue-800 font-bold">
                      Model execution
                    </h3>
                  </div>
                  <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>

                  <div className="flex-1 overflow-y-auto pr-2">
                    <ModelExecuteProcess
                      isRunning={isRunning || modelTaskStatus === "running"}
                      taskStatus={modelTaskStatus}
                      result={modelRunResult}
                      error={modelRunError}
                      modelName={recommendedModelName}
                      workflow={workflow}
                    />
                  </div>
                </div>
              )}

              {/* 输入态：显示输入表单和 Run 按钮 */}
              {recommendedModelName && rightPanelMode === "form" && (
                <div className="flex-1 custom-scrollbar mb-8">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Sparkles size={20} className="text-blue-800" />
                      <h3 className="text-2xl text-blue-800 font-bold">
                        Model recommendation
                      </h3>
                    </div>
                    <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xl text-blue-800 font-extrabold">
                        {recommendedModelName}
                      </p>
                      <button
                        type="button"
                        onClick={handleToggleRecommendedModelFavorite}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          isRecommendedModelFavorited
                            ? "border-rose-300 bg-rose-50 text-rose-600"
                            : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        <Heart
                          size={14}
                          className={isRecommendedModelFavorited ? "fill-rose-500 text-rose-500" : "text-blue-700"}
                        />
                        {isRecommendedModelFavorited ? "已收藏" : "收藏模型"}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {recommendedModelDesc}
                    </p>
                  </div>

                  <div className="flex-1 space-y-6 mb-5">
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
                              className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <div className="w-1 h-3 bg-blue-400 rounded-full" />
                                <h5 className="text-lg font-semibold text-gray-800">
                                  {event.eventName}
                                </h5>
                              </div>
                              <div>
                                {event.eventDescription && (
                                  <p className="w-full mb-2 text-sm leading-relaxed line-clamp-1 text-gray-500">
                                    {event.eventDescription}
                                  </p>
                                )}
                              </div>

                              {/* input层 */}
                              <div className="space-y-3">
                                {event.inputs.map((input, iIdx) => {
                                  const value = uploadedData[input.name];
                                  const isFile =
                                    input.type.toUpperCase() === "FILE";

                                  const specificContract = Array.isArray(
                                    modelContract,
                                  )
                                    ? modelContract.find(
                                        (c) =>
                                          (c.Input_name || c.slot_name) ===
                                          input.name,
                                      )
                                    : modelContract?.Required_slots?.find(
                                        (c: ModelContractItem) =>
                                          (c.Input_name || c.slot_name) ===
                                          input.name,
                                      );

                                  return (
                                    <div
                                      key={`input-${state.stateName}-${event.eventName}-${input.name}-${iIdx}`}
                                      className="group relative flex flex-col gap-1 p-2 rounded-lg transition-colors border border-transparent"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                            {input.name}
                                            <span className="relative inline-flex items-center group/info">
                                              <Info
                                                size={12}
                                                className="text-gray-400 transition-colors group-hover/info:text-blue-500"
                                              />
                                              {specificContract && (
                                                <div className="invisible opacity-0 group-hover/info:visible group-hover/info:opacity-100 absolute left-full top-1/2 -translate-y-1/2 ml-4 z-100 transition-all duration-200 -translate-x-2 group-hover/info:translate-x-0 group-focus-within/info:translate-x-0">
                                                  <RequirementTooltip
                                                    contract={specificContract}
                                                  />
                                                </div>
                                              )}
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isFile ? (
                                          <div className="flex items-center gap-2 w-full">
                                            <label
                                              className={`shrink-0 cursor-pointer flex justify-center items-center h-8 px-3 border rounded-md text-sm transition-all
                                              ${value ? "bg-green-50 hover:bg-green-100 text-green-600 border-green-600" : "bg-gray-100 hover:bg-blue-50 text-blue-600 border-blue-300 border-dashed"}`}
                                            >
                                              {value
                                                ? "Reupload"
                                                : "Select File"}
                                              <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  if (file) {
                                                    setUploadedData((p) => ({
                                                      ...p,
                                                      [input.name]:
                                                        e.target.files?.[0] ||
                                                        null,
                                                    }));

                                                    // 添加到已上传文件列表
                                                    // 先移除同一inputName的旧文件，再添加新的
                                                    setUploadedFiles((prev) => [
                                                      ...prev.filter(
                                                        (f) =>
                                                          f.inputName !==
                                                          input.name,
                                                      ),
                                                      {
                                                        name: file.name,
                                                        file,
                                                        inputName: input.name,
                                                      },
                                                    ]);

                                                    // 清理所有扫描结果（重新上传会使旧的扫描结果失效）
                                                    setScanResults({});
                                                    // 清理对齐结果
                                                    setAlignmentResult(null);
                                                  }
                                                }}
                                              />
                                            </label>
                                            <span
                                              className={`text-xs truncate transition-colors ${
                                                value instanceof File
                                                  ? "text-green-600 italic"
                                                  : "text-gray-400"
                                              }`}
                                            >
                                              {value instanceof File
                                                ? `"${value.name}" has been successfully uploaded!`
                                                : "No data detected!"}
                                            </span>
                                          </div>
                                        ) : (
                                          <input
                                            className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 transition-colors text-black"
                                            placeholder="Please enter the input data..."
                                            value={
                                              typeof value === "string" ||
                                              typeof value === "number"
                                                ? String(value)
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const nextValue = e.target.value;
                                              setUploadedData((p) => ({
                                                ...p,
                                                [input.name]: nextValue,
                                              }));
                                            }}
                                            onBlur={(e) => {
                                              handleInputChange(
                                                input.name,
                                                e.target.value,
                                              );
                                            }}
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

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 扫描按钮 */}
                    <button
                      disabled={uploadedFiles.length === 0 || isScanning}
                      onClick={handleBatchScan}
                      className="w-full py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ScanSearch size={16} />
                      {isScanning
                        ? "Scanning..."
                        : `Scan (${uploadedFiles.length})`}
                    </button>

                    <button
                      disabled={!isAllInputsFilled()}
                      onClick={handleRun}
                      className="w-full py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Play size={16} />
                      Run
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 扫描结果模态窗口 */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-200"
            onClick={() => setShowScanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl w-8/12 h-4/5 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-5 bg-slate-900 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Earth size={24} className="text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    Data scanning results
                  </h2>
                </div>
                <button
                  onClick={() => setShowScanModal(false)}
                  className="text-white hover:text-gray-500 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 内容区 */}
              <div className="flex flex-1 overflow-hidden">
                {/* 左侧：地图数据显示 */}
                <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                  {uploadedFiles.length > 0 &&
                  getAllGeoJsonDataForMap.length > 0 ? (
                    <MapboxViewer geoJsonDataArray={getAllGeoJsonDataForMap} />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <p className="text-gray-400">
                        Display the map here after uploading the file.
                      </p>
                    </div>
                  )}
                </div>

                {/* 右侧：扫描结果 */}
                <div className="w-[45%] flex flex-col">
                  <div className="shrink-0 border-b border-gray-200">
                    {scanResults && (
                      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:bg-slate-100 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                        {uploadedFiles.map((file, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              setSelectedScanFile(`${file.name}-${idx}`)
                            }
                            className={`text-left px-4 py-2 transition-all ${
                              selectedScanFile === `${file.name}-${idx}`
                                ? "bg-slate-400"
                                : "bg-gray-100 hover:border-gray-300"
                            }`}
                          >
                            <div
                              className={`text-xs text-gray-500 ${
                                selectedScanFile === `${file.name}-${idx}`
                                  ? "text-white"
                                  : "text-gray-700"
                              }`}
                            >
                              {file.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    {isScanning ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p className="text-gray-600">Scanning...</p>
                        </div>
                      </div>
                    ) : selectedScanFile && scanResults[selectedScanFile] ? (
                      <div className="space-y-4">
                        <FinalProfileCard
                          profile={
                            scanResults[selectedScanFile]?.profile ||
                            scanResults[selectedScanFile]
                          }
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a file to view scan results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部对齐结论 + 操作栏 */}
              <div className="flex flex-col md:flex-row md:h-50 gap-3 border-t border-gray-200 p-4 bg-white">
                <div className="hidden md:block w-1 self-stretch rounded-full bg-gray-900" />
                <div className="flex-1 min-w-0 rounded-lg p-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:bg-slate-100 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                  {alignmentResult ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">
                            Alignment conclusion
                          </h3>
                          {typeof alignmentResult.overall_score ===
                            "number" && (
                            <p className="text-[13px] font-semibold text-red-700">
                              (Overall Score:
                              <span className="font-semibold text-red-700">
                                {(alignmentResult.overall_score * 100).toFixed(
                                  0,
                                )}
                                %
                              </span>
                              )
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isNoGoAlignment
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isNoGoAlignment ? "NO-GO" : "GO"}
                        </span>
                      </div>

                      {alignmentResult.summary && (
                        <div className="text-xs text-gray-600 leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {alignmentResult.summary}
                          </ReactMarkdown>
                        </div>
                      )}

                      {isNoGoAlignment &&
                        Array.isArray(alignmentResult.blocking_issues) &&
                        alignmentResult.blocking_issues.length > 0 && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-2">
                            <p className="text-xs font-semibold text-red-700 mb-1">
                              Blocking Issues
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {alignmentResult.blocking_issues.map(
                                (issue: string, idx: number) => (
                                  <li
                                    key={`blocking-${idx}`}
                                    className="text-xs text-red-700 leading-relaxed"
                                  >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {issue}
                                    </ReactMarkdown>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {!isNoGoAlignment && (
                        <p className="text-xs text-green-700">
                          Current can run now!
                        </p>
                      )}

                      {isNoGoAlignment &&
                        Array.isArray(
                          alignmentResult.suggested_transformations,
                        ) &&
                        alignmentResult.suggested_transformations.length >
                          0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              Suggested Transformations
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {alignmentResult.suggested_transformations.map(
                                (transformation: string, idx: number) => (
                                  <li
                                    key={`transformation-${idx}`}
                                    className="text-xs text-gray-600 leading-relaxed"
                                  >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {transformation}
                                    </ReactMarkdown>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Click Align to generate alignment conclusion.
                    </p>
                  )}
                </div>

                <div className="w-full shrink-0 md:w-40 flex flex-col justify-center gap-2">
                  <button
                    onClick={handleAlign}
                    disabled={!activeChatId || isAligning || isScanning}
                    title="对齐数据与模型要求"
                    className="w-full px-3 py-3 bg-slate-900 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-300 transition-all"
                  >
                    {isAligning ? "Aligning..." : "Align"}
                  </button>

                  {isNoGoAlignment && (
                    <button
                      onClick={handleMapping}
                      disabled={!activeChatId || isAligning || isScanning}
                      title="映射数据为模型要求"
                      className="w-full px-3 py-3 bg-slate-900 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-300 transition-all"
                    >
                      Map
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
