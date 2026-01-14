import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { ToolEvent } from "../types";

function ProfileItem({ 
  label, 
  value, 
  isCode = false, 
  color = "gray" 
}: { 
  label: string; 
  value: any; 
  isCode?: boolean;
  color?: string;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-[14px] font-bold text-black uppercase">
        {label}
      </span>
      <div className={`
        ${isCode ? 'text-[13px] leading-relaxed break-all bg-gray-50 p-1.5 border border-gray-100' : 'text-[13px]'}
        text-gray-800 rounded
      `}>
        {value}
      </div>
    </div>
  );
}

// 渲染动态字段：排除掉已知的通用大类，剩下的以 Key-Value 对形式展示
function renderDynamicFields(profile: any) {
  const commonKeys = ['form', 'spatial', 'temporal', 'file_path', 'file_type', 'primary_file', 'confidence', 'status'];
  
  return Object.entries(profile)
    .filter(([key, value]) => !commonKeys.includes(key) && value !== null && typeof value !== 'object')
    .map(([key, value]) => (
      <ProfileItem 
        key={key} 
        label={key.replace(/_/g, ' ')}
        value={String(value)} 
      />
    ));
}

function renderResult(e: ToolEvent) {
  // 指标库：只显示 name_en / name_cn
  if (e.kind === "search_relevant_indices" && Array.isArray(e.result?.indices)) {
    return (
      <div className="flex gap-2">
        {e.result.indices.map((i: any, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center bg-blue-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap"
          >
            {i.name_cn || i.name_en}
          </span>
        ))}
      </div>
    );
  }

  // 模型库：只显示 modelName
  if (e.kind === "search_relevant_models" && Array.isArray(e.result?.models)) {
    return (
      <div className="flex gap-2 flex-wrap">
        {e.result.models.map((m: any, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center bg-blue-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap"
          >
            {m.modelName}
          </span>
        ))}
      </div>
    );
  }

  if (e.kind === "tool_generate_profile" && e.result?.profile) {
    console.log("Profile Result:", e.result);
    const p = e.result.profile;
    return (
      <div className="bg-white overflow-hidden shadow-sm">
        {/* 顶部类型条 */}
        <div className="bg-blue-800 px-3 py-2 flex justify-between items-center">
          <span className="text-white text-base font-bold uppercase tracking-wider">
            {p.form || "Unknown"} Data Profile
          </span>
          <span className="text-blue-100 text-[12px] font-mono">
            {p.file_type}
          </span>
        </div>

        {/* 核心参数网格 */}
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <h4 className="text-[16px] font-bold text-blue-700 uppercase border-b border-blue-500 pb-1">空间域信息</h4>
            <div className="grid grid-cols-1 gap-2">
              <ProfileItem
                label="CRS"
                value={p.spatial.crs || "未知参考系"}
                isCode
              />
              {p.spatial.extent && (
                <ProfileItem
                  label="Extent"
                  value={
                    Array.isArray(p.spatial.extent)
                      ? p.spatial.extent.map((v: number) => v.toFixed(2)).join(", ")
                      : "N/A"
                  }
                  isCode
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[16px] font-bold text-blue-700 uppercase border-b border-blue-500 pb-1">时间域信息</h4>
            <div className="grid grid-cols-1 gap-2">
              <ProfileItem
                label="Temporal Coverage"
                value={p.temporal.has_time || "Unknown"}
              />
              <div className="grid grid-cols-2 gap-2">
              <ProfileItem label="起始时间" value={p.temporal.start_time || "N/A"} />
              <ProfileItem label="结束时间" value={p.temporal.end_time || "N/A"} />
            </div>
            </div>
          </div>

          <div className="space-y-2">
          <h4 className="text-[16px] font-bold text-blue-700 uppercase border-b border-blue-500 pb-1">特殊信息</h4>
          <div className="grid grid-cols-2 gap-3">
            {renderDynamicFields(p)}
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (e.status === "error" && e.result) {
    const errorMsg =
      typeof e.result === "string"
        ? e.result
        : e.result?.error?.message || JSON.stringify(e.result);

    return (
      <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-mono break-all leading-relaxed">
        {errorMsg}
      </div>
    );
  }
  return null;
}

export default function ToolTimeline({ events }: { events: ToolEvent[] }) {
  return (
    <div className="relative space-y-4">
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex gap-4"
          >
            {/* 状态图标 */}
            <div className="relative z-10">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  event.status === "running"
                    ? "bg-yellow-100 text-yellow-600"
                    : event.status === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {event.status === "running" && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {event.status === "success" && <CheckCircle2 size={14} />}
                {event.status === "error" && <XCircle size={14} />}
              </div>
            </div>

            {/* 事件内容 */}
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900 mb-1">
                {event.title}
              </p>

              {/* 结果展示 */}
              {event.result && (
                <div className="mt-2 text-base text-gray-700">
                  {renderResult(event)}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
