import React, { useState } from "react";
import { useOutletContext } from 'react-router-dom';

export default function IntelligentDecision() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // Pop up input slot after model recommendation
  const [recommendedModel, setReconmmendedModel] = useState<string | null>(null);
  const [requiredInputs, setRequiredInputs] = useState<string[]>([]);

  // Store user uploaded files
  const [uploadedData, setUploadedData] = useState<Record<string, File | null>>({});

  // Show running state
  const [runStatus, setRunStatus] = useState<String[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Simulate LLM to recommend model
  const simulateLLMRecommend = () => {
    setReconmmendedModel("城市扩张预测模拟模型");
    setRequiredInputs(["土地利用栅格.tif", "人口密度数据.csv", "交通路网.shp"]);
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
    <div className="flex flex-1 overflow-hidden">

      {/* ------------------------------- Left Sidebar ------------------------------- */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col p-4">

        {/* <h3 className="font-semibold mb-2">🧩 Simulation Resources</h3>
        <div className="space-y-2 flex-1 overflow-auto">
          <button className="w-full p-2 rounded bg-gray-800 hover:bg-gray-700">导入数据</button>
          <button className="w-full p-2 rounded bg-gray-800 hover:bg-gray-700">模型库</button>
        </div>
        
        <hr className="my-3 opacity-40"/> */}

        <h3 className="font-semibold mb-3">📁 Historical Records</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {[1,2,3].map(i => (
            <button key={i} className="w-full text-left p-2 rounded hover:bg-gray-700">
              会话记录 {i}
            </button>
          ))}
        </div>

        <button 
          onClick={simulateLLMRecommend}
          className="mt-6 bg-green-600 p-2 rounded hover:bg-green-700">
          ⚡ 模拟LLM推荐模型
        </button>
      </aside>


      {/* ------------------------------- Middle Chat Panel ------------------------------- */}
      <main className="flex-1 flex flex-col border-r border-gray-300">

        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-white">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-20">
              👋 Enter your instructions to start the decision process
              <br/>(example: help me predict land use change)
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="p-3 max-w-xl rounded-lg bg-blue-50">
              {msg}
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-white flex items-center gap-3">
          <input
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            className="flex-1 p-2 border rounded focus:ring-2 ring-blue-400 text-black"
          />

          <button
            onClick={()=>{
              if(input.trim()){
                setMessages([...messages,input]);
                setInput("");
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </main>

      {/* ------------------------------- Right InputSlots + Result Panel ------------------------------- */}
      <section className="w-[32%] bg-white flex flex-col shadow-inner border-l p-4">
        {/* Now, LLM don't recommend any model —— recommendedModel: false; isRunning: false */}
        {!recommendedModel && !isRunning && (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
            <p className="text-lg font-medium">⏳ Wait for the LLM to recommend model... </p>
          </div>
        )}

        {/* Now, LLM has recommend the most suitable model, and user needs to upload data */}
        {recommendedModel && !isRunning && (
          <div>
            <div>
              <h3 className="text-black font-bold mb-2">Model has been recommend: {recommendedModel}</h3>
              <p className="text-sm text-black mb-3">Please upload the data required by the model</p>

              {requiredInputs.map(key => (
                <div key={key} className="flex items-center gap-2 mb-3 text-black">
                  <span className="w-40 font-medium text-black">{key}</span>
                  <input type="file"
                         onChange={e=>setUploadedData(pre=>({...pre, [key]: e.target.files?.[0] ?? null }))}
                         className="border rounded p-1 flex-1"
                  >
                  </input>
                  {uploadedData[key] && <span className="text-green-600">✔</span>}
                </div>
              ))}

              <button disabled={Object.keys(uploadedData).length < requiredInputs.length}
                onClick={handleRun}
                className="w-full mt-4 p-2 bg-green-600 text-white rounded disabled:bg-gray-400">
                  Running
              </button>
            </div>
          </div>
        )}

        {/* Now, LLM has recommend the most suitable model, and user has uploaded data */}
        {recommendedModel && isRunning && (
          <div className="space-y-3">
            <h3 className="text-black font-bold mb-2">Model execute process</h3>
            {runStatus.map((s,i) => (
              <div key={i} className="p-2 border rounded bg-gray-50 text-black">{s}</div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
