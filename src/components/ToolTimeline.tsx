import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { ToolEvent } from "../types";

// 升级版 ProfileItem：增加微小的视觉装饰
function ProfileItem({ label, value, isCode = false }: { label: string; value: any; isCode?: boolean }) {
  return (
    <div className="group flex flex-col px-2 rounded-md transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100">
      <span className="text-[15px] font-black text-black tracking-wide mb-2">
        {label.replace(/_/g, ' ')}
      </span>
      <div className={`
        ${isCode ? 'font-mono text-[14px] text-black leading-relaxed break-all bg-slate-100/50 p-2 border border-slate-200 shadow-inner' : 'text-[14px] text-gray-500 italic'}
        rounded transition-all
      `}>
        {value}
      </div>
    </div>
  );
}

// 渲染动态字段：排除掉已知的通用大类，剩下的以 Key-Value 对形式展示
function renderDynamicFields(profile: any) {
  const commonKeys = ['form', 'Spatial', 'Temporal', 'file_path', 'file_type', 'primary_file', 'confidence', 'status'];
  
  return Object.entries(profile)
    .filter(([key, value]) => !commonKeys.includes(key) && value !== null)
    .map(([key, value]) => {
      // 处理数组
      if (key === 'Attributes' && Array.isArray(value)) {
        return (
          <div key={key} className="col-span-2 space-y-2 px-2">
            <span className="text-[15px] font-bold text-black">
              {key}
            </span>
            <div className="flex flex-wrap gap-2">
              {value.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 mt-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-xs"
                >
                  <span className="text-black text-[14px]">{item.name}</span>
                  <span className="text-black text-[14px]"> | </span>
                  <span className="text-black text-[14px] italic">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'Resolution' && typeof value === 'object' && !Array.isArray(value)) {
        const res = value as any;
        return (
          <div key={key} className="col-span-2">
            <div className="grid grid-cols-2 gap-2">
              <ProfileItem
                label={`${key} X`}
                value={res.x ? `${Number(res.x).toFixed(3)} m` : "N/A"}
              />
              <ProfileItem
                label={`${key} Y`}
                value={res.y ? `${Number(res.y).toFixed(3)} m` : "N/A"}
              />
            </div>
          </div>
        );
      }

      if (key === 'Value_range' && Array.isArray(value)) {
        return (
          <div key={key} className="col-span-2">
            <ProfileItem
              label={key}
              value={`${value[0].toFixed(4)} ~ ${value[1].toFixed(4)}`}
              isCode={true}
            />
          </div>
        )
      }

      // 处理嵌套对象
      if (typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={key} className="col-span-2">
            <ProfileItem
              label={key}
              value={JSON.stringify(value, null, 2)}
              isCode={true}
            />
          </div>
        );
      }

      // 1. 特殊处理：数值范围或极值 (针对 nodata 或 value_range)
      // 处理类似 -3.402823e+38 这种科学计数法，防止 UI 溢出
      if (typeof value === 'number' && Math.abs(value) > 1e10) {
        return (
          <ProfileItem 
            key={key} 
            label={key} 
            value={<span className="text-red-400 font-mono text-[10px]">Out of range</span>} 
          />
        );
      }

      // 普通字段
      return (
        <ProfileItem
          key={key}
          label={key}
          value={String(value)}
        />
      )
    });
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

  if (e.kind.startsWith("tool_analyze_") && e.result?.profile) {
    const p = e.result.profile;
    const s = p.Spatial;
    const crsInfo = s.Crs;
    return (
      <div className="bg-white border border-slate-200 rounded-t-xl overflow-hidden shadow-xl w-full max-w-full my-2">
        {/* 头部设计 */}
        <div className="bg-linear-to-r from-blue-900 to-indigo-800 px-4 py-2.5 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-blue-400/20 p-1.5 rounded-lg border border-blue-400/30">
              <CheckCircle2 className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-white text-[16px] font-bold tracking-wide">
                Data Analysis Profile
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-white text-[14px] font-bold px-2 py-0.5 bg-blue-400/20 rounded-full border border-white/20 tracking-wide">
              Form | {p.form}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6 bg-slate-50/30">
          {/* 第一部分：空间域 */}
          <section className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-full"></div>
            <h4 className="text-[16px] font-bold text-blue-700 tracking-wide flex items-center gap-2">
              Spatial Domain{" "}
              <span className="h-px flex-1 bg-linear-to-r from-blue-700 via-blue-100 to-transparent"></span>
            </h4>
            <div className="p-2 grid grid-cols-1 gap-">
              {typeof crsInfo === "object" && crsInfo !== null ? (
                <div className="col-span-2">
                  <div className="col-span-2 flex flex-col mb-2">
                    <span className="text-[15px] font-black text-black tracking-wide mb-2">
                      CRS
                    </span>
                    <span className="text-[14px] text-gray-500 italic">
                      {crsInfo.Name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[15px] text-black font-bold">
                        Datum_plane
                      </span>
                      <span className="text-[14px] text-gray-500 italic">
                        {crsInfo.Datum}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] text-black font-bold">
                        Projection_method
                      </span>
                      <span className="text-[14px] text-gray-500 italic">
                        {crsInfo.Projection}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] text-black font-bold">
                        Central_meridian
                      </span>
                      <span className="text-[14px] text-gray-500 italic">
                        {crsInfo.Central_meridian}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] text-black font-bold">
                        Unit
                      </span>
                      <span className="text-[14px] text-gray-500 italic">
                        {crsInfo.Unit}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <ProfileItem
                  label="CRS"
                  value={String(crsInfo.Wkt || "Unknown")}
                  isCode
                />
              )}
            </div>

            {p.Spatial.Extent && (
                <ProfileItem
                  label="Extent"
                  value={p.Spatial.Extent.map((v: number) => v.toFixed(3)).join(
                    " , "
                  )}
                  isCode
                />
              )}
          </section>

          {/* 第二部分：时间域 */}
          <section className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 rounded-full"></div>
            <h4 className="text-[16px] font-bold text-orange-400 tracking-wide flex items-center gap-2">
              Temporal Domain{" "}
              <span className="h-px flex-1 bg-linear-to-r from-orange-400 via-orange-100 to-transparent"></span>
            </h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="col-span-2">
                <ProfileItem
                  label="Timeline Status"
                  value={
                    p.Temporal?.Has_time
                      ? "Time-Series Enabled"
                      : "Static Snapshot"
                  }
                />
              </div>
              <ProfileItem
                label="Start"
                value={p.Temporal?.start_time || "N/A"}
              />
              <ProfileItem label="End" value={p.Temporal?.end_time || "N/A"} />
            </div>
          </section>

          {/* 第三部分：动态特有属性 */}
          <section className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-full"></div>
            <h4 className="text-[16px] font-bold text-green-600 tracking-wide flex items-center gap-2">
              Special Attributes{" "}
              <span className="h-px flex-1 bg-linear-to-r from-green-600 via-green-100 to-transparent"></span>
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {renderDynamicFields(p)}
            </div>
          </section>
        </div>

        {/* 底部装饰 */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
          <span>AUTO-GENERATED BY AGENT</span>
          <span>CONFIDENCE: {(p.confidence * 100).toFixed(0)}%</span>
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
            className="relative flex gap-2"
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
                  <Loader2 size={16} className="animate-spin" />
                )}
                {event.status === "success" && <CheckCircle2 size={16} />}
                {event.status === "error" && <XCircle size={16} />}
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
