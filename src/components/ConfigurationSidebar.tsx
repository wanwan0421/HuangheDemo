import { useState } from "react";
import { X, Upload, FileText, CheckCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WorkflowState, Message } from "../types";
import ModelContract from "./ModelContract";
import ToolTimeline from "./ToolTimeline";

interface ConfigurationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  modelContract: any;
  workflow: WorkflowState[];
  uploadedData: Record<string, File | string | number | null>;
  messages: Message[];
  onDataChange: (key: string, value: File | string | number) => void;
  onFileUpload: (slotId: string, file: File) => void;
  onRunModel: () => void;
  isRunning: boolean;
  runStatus: string[];
}

export default function ConfigurationSidebar({
  isOpen,
  onClose,
  modelName,
  modelContract,
  workflow,
  uploadedData,
  messages,
  onDataChange,
  onFileUpload,
  onRunModel,
  isRunning,
  runStatus,
}: ConfigurationSidebarProps) {
  const [activeTab, setActiveTab] = useState<"data" | "config" | "result">(
    isRunning ? "result" : "data"
  );

  // 检查数据是否准备好
  const isDataReady = modelContract?.Required_slots?.every((slot: any) => {
    const slotKey = slot.Input_name || slot.slot_name;
    return uploadedData[slotKey] !== undefined && uploadedData[slotKey] !== null;
  });

  // 检查配置是否完成
  const isConfigComplete = workflow.every((state) =>
    state.events.every((event) =>
      event.inputs.every((input) => {
        const value = uploadedData[input.name];
        return value !== undefined && value !== null;
      })
    )
  );

  const handleRun = () => {
    onRunModel();
    setActiveTab("result");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* 右侧侧面板 */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">配置模型</h2>
                <p className="text-xs text-gray-600 mt-0.5">{modelName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/80 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-4 py-3 bg-gray-50 border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab("data")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === "data"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Upload size={16} />
                <span>数据</span>
                {isDataReady && <CheckCircle size={14} className="text-green-500" />}
              </button>

              <ChevronRight size={16} className="text-gray-300" />

              <button
                onClick={() => setActiveTab("config")}
                disabled={!isDataReady}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === "config"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                }`}
              >
                <FileText size={16} />
                <span>参数</span>
                {isConfigComplete && <CheckCircle size={14} className="text-green-500" />}
              </button>

              {isRunning && (
                <>
                  <ChevronRight size={16} className="text-gray-300" />
                  <button
                    onClick={() => setActiveTab("result")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      activeTab === "result"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <span>结果</span>
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "data" && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* 数据契约 */}
                  {modelContract?.Required_slots && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        数据要求
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <ModelContract contracts={modelContract} />
                      </div>
                    </div>
                  )}

                  {/* 数据上传卡片 */}
                  {modelContract?.Required_slots?.map((slot: any) => {
                    const slotKey = slot.Input_name || slot.slot_name;
                    const slotName = slot.Input_name || slot.slot_name;
                    const uploadedFile = uploadedData[slotKey] as File | undefined;
                    const hasFile = !!uploadedFile;

                    return (
                      <div
                        key={slotKey}
                        className={`border-2 border-dashed rounded-lg p-3 transition-all ${
                          hasFile
                            ? "border-green-300 bg-green-50"
                            : "border-gray-300 bg-white hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                              hasFile ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {hasFile ? "✓" : "📁"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 text-sm">{slotName}</h4>
                            {(slot.Semantic_requirement || slot.semantic_requirement) && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {slot.Semantic_requirement || slot.semantic_requirement}
                              </p>
                            )}

                            <label className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                              {hasFile ? "重新上传" : "选择文件"}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onFileUpload(slotKey, file);
                                  }
                                }}
                              />
                            </label>

                            {hasFile && (
                              <p className="text-xs text-green-700 mt-1 font-medium truncate">
                                ✓ {uploadedFile?.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 数据扫描进度 */}
                  {messages
                    .filter((m) => m.type === "data" && m.tools?.length)
                    .map((msg) => (
                      <div key={msg.id} className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">
                          数据扫描
                        </h4>
                        <ToolTimeline msg={msg} />
                      </div>
                    ))}
                </motion.div>
              )}

              {activeTab === "config" && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-semibold text-gray-800">工作流参数</h3>

                  {workflow.map((state, sIdx) => (
                    <div
                      key={`state-${sIdx}`}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {sIdx + 1}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {state.stateName}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {state.events.map((event, eIdx) => (
                          <div key={`event-${eIdx}`} className="pl-3 border-l-2 border-blue-200">
                            <h5 className="text-xs font-medium text-gray-800 mb-2">
                              {event.eventName}
                            </h5>

                            <div className="space-y-2">
                              {event.inputs.map((input, iIdx) => {
                                const value = uploadedData[input.name];
                                const isFile = input.type.toUpperCase() === "FILE";

                                return (
                                  <div key={`input-${iIdx}`} className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 block">
                                      {input.name}
                                    </label>

                                    {isFile ? (
                                      <label className="flex items-center gap-1.5 p-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <Upload size={14} className="text-gray-500" />
                                        <span className="text-xs text-gray-700 truncate">
                                          {value instanceof File ? value.name : "选择文件"}
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              onDataChange(input.name, file);
                                            }
                                          }}
                                        />
                                      </label>
                                    ) : (
                                      <input
                                        type="text"
                                        value={(value as string) || ""}
                                        onChange={(e) =>
                                          onDataChange(input.name, e.target.value)
                                        }
                                        placeholder="请输入..."
                                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3 animate-spin">⚙️</div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      模型执行中
                    </h3>
                    <p className="text-xs text-gray-600">请稍候...</p>
                  </div>

                  <div className="space-y-2">
                    {runStatus.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="text-sm text-gray-800">{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                关闭
              </button>

              <div className="flex items-center gap-2">
                {activeTab === "data" && (
                  <button
                    onClick={() => setActiveTab("config")}
                    disabled={!isDataReady}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium disabled:bg-gray-300 transition-all"
                  >
                    下一步
                  </button>
                )}

                {activeTab === "config" && (
                  <>
                    <button
                      onClick={() => setActiveTab("data")}
                      className="px-4 py-2 text-gray-700 text-sm font-medium hover:text-gray-900"
                    >
                      上一步
                    </button>
                    <button
                      onClick={handleRun}
                      disabled={!isConfigComplete}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg font-medium disabled:from-gray-300 disabled:to-gray-400 transition-all"
                    >
                      🚀 运行
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
