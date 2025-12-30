import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Database, Boxes } from "lucide-react";

// 定义AI返回工具事件类型
interface ToolEvent {
  id: string;
  parentId?: string;
  status: "running" | "success" | "error";
  title: string;
  kind?: "search_index" | "search_model" | "model_details";
  result?: any;
}

function renderResult(e: ToolEvent) {
  // 指标库：只显示 name_en / name_cn
  if (e.kind === "search_index" && Array.isArray(e.result?.indices)) {
    return (
      <div className="flex gap-1">
        {e.result.indices.map((i: any, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-100 text-xs whitespace-nowrap"
          >
            {i.name_cn || i.name_en}
          </span>
        ))}
      </div>
    );
  }

  // 模型库：只显示 modelName
  if (e.kind === "search_model" && Array.isArray(e.result?.models)) {
    return (
      <div className="flex gap-1 flex-wrap">
        {e.result.models.map((m: any, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-100 text-xs whitespace-nowrap"
          >
            {m.modelName}
          </span>
        ))}
      </div>
    );
  }

  if (e.status === "error" && e.result) {
    const errorMsg =
      typeof e.result === "string"
        ? e.result
        : e.result?.error?.message || JSON.stringify(e.result);

    return (
      <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-mono break-all leading-relaxed">
        {errorMsg}
      </div>
    );
  }
  return null;
}

export default function ToolTimeline({ events }: { events: ToolEvent[] }) {
  return (
    <div className="relative mt-6 pl-6 space-y-6">
      {/* 竖线 */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
      <AnimatePresence>
        {events.map((event, index) => (
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
              <p className="text-sm font-medium text-gray-900 mb-1">
                {event.title}
              </p>

              {/* 结果展示 */}
              {event.result && (
                <div className="mt-2 text-sm text-gray-700">
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
