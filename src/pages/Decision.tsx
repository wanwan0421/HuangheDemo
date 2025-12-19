import React, { useState } from "react";
import ChatInput from "../components/ChatInput";
import { SquarePen, Search, Sparkles, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModelExecuteProcess from "../components/ModelExecuteProcess"

// 后端API基础URL
const BACK_URL = import.meta.env.VITE_BACK_URL;

interface InputField {
  name: string;
  key: string;
  type: "file" | "text" | "number";
}

// 定义模型event的输入数据
interface WorkflowInput {
  name: string;
  key: string;
  type: string;
  description: string;
}

// 定义模型event
interface WorkflowEvent {
  eventName: string;
  eventDescription: string;
  inputs: WorkflowInput[];
}

// 定义模型state
interface WorkflowState {
  stateName: string;
  stateDescription: string;
  events: WorkflowEvent[];
}

// Reducer Action Types
type Action = { type: 'ADD_STEP', payload: string } | { type: 'RESET' };

function runStatusReducer(state: String[], action: Action): String[] {
  switch (action.type) {
    case 'ADD_STEP':
      return [...state, action.payload];
    case 'RESET':
      return [];
    default:
      return state;
  }
}

export default function IntelligentDecision() {
  const [activaChatId, setActiveChatId] = useState<number | null>(1);
  const [messages, setMessages] = useState<string[]>([]);

  // Pop up input slot after model recommendation
  const [reconmmendedModelName, setReconmmendedModelName] = useState<string | null>(null);
  const [reconmmendedModelDesc, setReconmmendedModelDesc] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState[]>([]);

  // Store user uploaded files
  const [uploadedData, setUploadedData] = useState<
    Record<string, File | string | number | null>
  >({});

  // Show running state
  // const [runStatus, setRunStatus] = useState<String[]>([]);
  const [runStatus, dispatch] = React.useReducer(runStatusReducer, []);
  const [isRunning, setIsRunning] = useState(false);

  // Simulate LLM to recommend model
  const simulateLLMRecommend = () => {
    setReconmmendedModelName("城市扩张预测模拟模型");
    setReconmmendedModelDesc("基于MABR的城市扩张预测模拟模型，适用于中小型城市的土地利用变化预测。");
    setWorkflow([
      {
        stateName: "preparation_DLPS",
        stateDescription: "基于地块的凸包的MABR对地块进行分割。",
        events: [
          {
            eventName: "土地利用栅格",
            eventDescription: "准备输入数据，包括地理数据和属性数据。",
            inputs: [
              { name: "土地利用栅格", key: "landuse_raster", type: "file", description: "上传土地利用类型的栅格数据文件" }
            ]
          },
          {
            eventName: "人口密度数据",
            eventDescription: "准备输入数据，包括地理数据和属性数据。",
            inputs: [
              { name: "人口密度数据", key: "population_density", type: "file", description: "上传人口密度数据文件" }
            ]
          },
          {
            eventName: "交通路网类型",
            eventDescription: "准备输入数据，包括地理数据和属性数据。",
            inputs: [
              { name: "交通路网类型", key: "road_type", type: "text", description: "输入交通路网类型" }
            ]
          },
          {
            eventName: "预测年份",
            eventDescription: "准备输入数据，包括地理数据和属性数据。",
            inputs: [
              { name: "预测年份", key: "predict_year", type: "number", description: "输入预测年份" },
            ]
          },
        ]
      }
    ]);
  };

  // User clik running button
  const handleRun = () => {
    setIsRunning(true);
    dispatch({ type: "RESET" });

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
        setTimeout(executeStep, 1000);
      } else {
        dispatch({ type: "ADD_STEP", payload: "Model execution finished!" });
      }
    };
    // 强制立即启动
    executeStep();
  };

  // 向后端发送消息并获取推荐的方法
  const handleSendMessage = async (prompt: string) => {
    setMessages((prev) => [...prev, prompt]);
    try {
      const response = await fetch(`${BACK_URL}/llm-agent/recommendModel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.success) {
        setReconmmendedModelName(data.data.name);
        setReconmmendedModelDesc(data.data.description);
        setWorkflow(data.data.workflow);
      }
    } catch (error) {
      console.error("Error fetching recommended model:", error);
    }
  };

  // 用于检查所有输入数据是否已经填写完整
  const isAllInputsFilled = () => {
    const allKeys: string[] = [];
    workflow.forEach((state) => {
      state.events.forEach((event) => {
        event.inputs.forEach((input) => {
          allKeys.push(input.key);
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

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* ------------------------------- Left Sidebar ------------------------------- */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col p-3">
        <div className="mb-5 space-y-2">
          <button
            className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
            onClick={() => {
              const newId = Date.now();
              setActiveChatId(newId);
            }}
          >
            <SquarePen size={20} />
            <span>New Chat</span>
          </button>

          <button className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition">
            <Search size={20} />
            <span>Search Chats</span>
          </button>
        </div>

        <h3 className="font-bold text-gray-200 mb-2 px-2">
          Historical Records
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {[1, 2, 3].map((i) => {
            const isActive = i === activaChatId;

            return (
              <button
                key={i}
                className={`w-full text-left p-2 rounded-lg transition ${
                  isActive
                    ? "bg-gray-100/50 text-white"
                    : "hover:bg-gray-700 text-white"
                }`}
              >
                Chat record {i}
              </button>
            );
          })}
        </div>

        <button
          onClick={simulateLLMRecommend}
          className="mt-6 bg-green-600 p-2 rounded hover:bg-green-700"
        >
          ⚡ 模拟LLM推荐模型
        </button>
      </aside>

      {/* ------------------------------- Middle Chat Panel ------------------------------- */}
      <main className="flex flex-1 flex-col">
        <div className="flex-1 p-6 overflow-y-auto bg-white min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full">
              <p className="text-gray-400 text-center">
                👋 Enter your instructions to start the decision process
                <br />
                (example: help me predict land use change)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="my-3 p-3 max-w-xl rounded-lg bg-gray-100 text-black"
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <ChatInput
          onSend={(msg) => handleSendMessage(msg)}
        />
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
            className="w-[32%] flex flex-col"
          >
            <div className="flex-1 bg-gray-100/50 rounded-lg m-5 p-4 shadow">
              {/* Now, LLM has recommend the most suitable model, and user needs to upload data */}
              {reconmmendedModelName && !isRunning && (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Sparkles size={20} className="text-blue-800" />
                      <h3 className="text-2xl text-blue-800 font-bold">Model recommendation</h3>
                    </div>
                    <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>

                    <p className="text-xl text-blue-600 font-extrabold">{reconmmendedModelName}</p>
                    <p className="text-[13px] text-gray-600 mt-1">{reconmmendedModelDesc}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 mb-5">
                    {workflow.map((state, sIdx) => (
                      <div
                        key={sIdx}
                        className="relative ml-2 pl-6 pb-2 border-l-2 border-blue-200"
                      >
                        {/* state层 */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                        <div className="mb-3">
                          <h4 className="text-lg font-bold text-black">{state.stateName}</h4>
                          {state.stateDescription && (
                            <p className="text-[13px] text-gray-500">{state.stateDescription}</p>
                          )}
                        </div>

                        {/* event层 */}
                        <div className="space-y-3">
                          {state.events.map((event, eIdx) => (
                            <div
                              key={eIdx}
                              className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <div className="w-1 h-3 bg-blue-400 rounded-full" />
                                <h5 className="text-md font-semibold text-gray-800">{event.eventName}</h5>
                              </div>
                              {event.eventDescription && (
                                  <p className="mb-2 text-[13px] text-gray-500">{event.eventDescription}</p>
                                )}

                              {/* input层 */}
                              <div className="space-y-3">
                                {event.inputs.map((input) => {
                                  const value = uploadedData[input.key];
                                  const isFile = input.type.toUpperCase() === "FILE";

                                  return (
                                    <div
                                      key={input.key}
                                      className="flex flex-col gap-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        {isFile ? (
                                          <div className="flex items-center gap-2 w-full">
                                            <label className="shrink-0 cursor-pointer flex justify-center items-center h-8 px-3 bg-gray-100 hover:bg-blue-50 text-blue-600 border border-dashed border-blue-300 rounded-md text-[13px] transition-all">
                                              {value ? "Reupload" : "Select File"}
                                              <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) =>
                                                  setUploadedData((p) => ({
                                                    ...p,
                                                    [input.key]:
                                                      e.target.files?.[0] ||
                                                      null,
                                                  }))
                                                }
                                              />
                                            </label>
                                            <span className="text-[12px] truncate text-gray-400">
                                              {value instanceof File
                                                ? value.name
                                                : "No data detected !"}
                                            </span>
                                          </div>
                                        ) : (
                                          <input
                                            className="w-full text-[13px] border-b border-gray-200 focus:border-blue-500 outline-none py-1 transition-colors text-black"
                                            placeholder={"Please enter parameters ..."}
                                            onChange={(e) =>
                                              setUploadedData((p) => ({
                                                ...p,
                                                [input.key]: e.target.value,
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
                    className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
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
                    <h3 className="text-2xl text-blue-800 font-bold">
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
