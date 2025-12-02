import React, { useState } from "react";
import ChatInput from "../components/ChatInput";
import { SquarePen, Search } from "lucide-react";

interface InputField {
  name: string;
  key: string;
  type: "file" | "text" | "number";   // 你也可以加 "select"
}

export default function IntelligentDecision() {
  const [activaChatId, setActiveChatId] = useState<number | null>(1);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // Pop up input slot after model recommendation
  const [recommendedModel, setReconmmendedModel] = useState<string | null>(null);
  const [requiredInputs, setRequiredInputs] = useState<InputField[]>([]);

  // Store user uploaded files
  const [uploadedData, setUploadedData] = useState<Record<string, File | string | number | null>>({});

  // Show running state
  const [runStatus, setRunStatus] = useState<String[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Simulate LLM to recommend model
  const simulateLLMRecommend = () => {
    setReconmmendedModel("城市扩张预测模拟模型");
    setRequiredInputs([
      { name: "土地利用栅格", key: "landuse_raster", type: "file" },
      { name: "人口密度数据", key: "population_density", type: "file" },
      { name: "交通路网类型", key: "road_type", type: "text" },
      { name: "预测年份", key: "predict_year", type: "number" },
    ]);
  }

  // User clik running button
  const handleRun = () => {
    setIsRunning(true);
    setRunStatus(["检查数据格式...", "数据预处理中...", "模型运行...", "输出结果生成中..."]);

    setTimeout(() => {
      setRunStatus(prev => [...prev, "模型运行完成！"]);
    }, 3500);
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">

      {/* ------------------------------- Left Sidebar ------------------------------- */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col p-3">
        <div className="mb-5 space-y-2">
          <button className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
            onClick={() => {
              const newId = Date.now();
              setActiveChatId(newId);
            }}>
            <SquarePen size={20} />
            <span>New Chat</span>
          </button>

          <button className="w-full py-2 px-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition">
            <Search size={20} />
            <span>Search Chats</span>
          </button>
        </div>

        <h3 className="font-bold text-gray-200 mb-2 px-2">Historical Records</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">

          {[1, 2, 3].map(i => {
            const isActive = i === activaChatId;

            return (
              <button
                key={i}
                className={`w-full text-left p-2 rounded-lg transition ${isActive ? 'bg-gray-100/50 text-white' : 'hover:bg-gray-700 text-white'}`}>
                Chat record {i}
              </button>
            );
          })}

        </div>

        <button
          onClick={simulateLLMRecommend}
          className="mt-6 bg-green-600 p-2 rounded hover:bg-green-700">
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
                <br />(example: help me predict land use change)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              {messages.map((msg, i) => (
                <div key={i} className="my-3 p-3 max-w-xl rounded-lg bg-gray-100 text-black">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <ChatInput onSend={(msg) => {
          setMessages(prev => [...prev, msg]);
        }}
        />
      </main>

      {/* ------------------------------- Right InputSlots + Result Panel ------------------------------- */}
      {/* Now, LLM don't recommend any model —— recommendedModel: false; isRunning: false */}
      {recommendedModel && !isRunning && (
        <section className="w-[32%] bg-white flex flex-col">
          <div className="flex-1 bg-gray-100/50 rounded-lg m-5 p-4 shadow">
            {/* Now, LLM has recommend the most suitable model, and user needs to upload data */}
            {recommendedModel && !isRunning && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl shadow bg-gray-50 border">
                  <h3 className="text-black font-bold mb-2">Recommend Model</h3>
                  <p className="text-xl text-black font-semibold mb-2">{recommendedModel}</p>
                </div>

                <p className="text-sm text-gray-600 mb-2">Please upload the data required by the model</p>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {requiredInputs.map(item => {
                    const value = uploadedData[item.key];   // ← 正确位置！！

                    return (
                      <div key={item.key} className="p-3 bg-white rounded-lg shadow border flex items-center gap-3 text-black">

                        {/* 字段名 */}
                        <span className="font-medium w-40">{item.name}</span>

                        {/* --- 文件类型 --- */}
                        {item.type === "file" && (
                          <>
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                              上传文件
                              <input
                                type="file"
                                className="hidden"
                                onChange={e =>
                                  setUploadedData(p => ({
                                    ...p,
                                    [item.key]: e.target.files?.[0] ?? null
                                  }))
                                }
                              />
                            </label>

                            {value instanceof File ? (
                              <span className="text-green-700 text-sm truncate max-w-[120px]">
                                {value.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">未选择文件</span>
                            )}
                          </>
                        )}

                        {/* --- 文本类型 --- */}
                        {item.type === "text" && (
                          <input
                            type="text"
                            className="flex-1 border rounded px-2 py-1"
                            onChange={e => setUploadedData(p => ({ ...p, [item.key]: e.target.value }))}
                            placeholder="请输入文本..."
                          />
                        )}

                        {/* --- 数字类型 --- */}
                        {item.type === "number" && (
                          <input
                            type="number"
                            className="flex-1 border rounded px-2 py-1"
                            onChange={e => setUploadedData(p => ({ ...p, [item.key]: Number(e.target.value) }))}
                            placeholder="请输入数字..."
                          />
                        )}
                      </div>
                    )
                  })}
                </div>


                <button disabled={Object.keys(uploadedData).length < requiredInputs.length}
                  onClick={handleRun}
                  className="w-full p-2 bg-green-600 text-white rounded disabled:bg-gray-400">
                  Running
                </button>
              </div>
            )}

            {/* Now, LLM has recommend the most suitable model, and user has uploaded data */}
            {recommendedModel && isRunning && (
              <div className="space-y-3">
                <h3 className="text-black font-bold mb-2">Model execute process</h3>
                {runStatus.map((s, i) => (
                  <div key={i} className="p-2 border rounded bg-gray-50 text-black">{s}</div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
