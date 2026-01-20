import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { ToolEvent } from "../types";

// 升级版 ProfileItem：增加微小的视觉装饰
function ProfileItem({ label, value, isCode = false }: { label: string; value: any; isCode?: boolean }) {
  return (
    <div className="group flex flex-col px-2 rounded-md transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100">
      <span className="text-[15px] font-bold text-black tracking-wide mb-2">
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

// 渲染动态字段：排除掉已知的通用大类
function renderDynamicFields(profile: any) {
  const commonKeys = ['Form', 'Spatial', 'Temporal', 'file_path', 'file_type', 'primary_file', 'Confidence', 'status', 'Semantic'];
  
  return Object.entries(profile)
    .filter(([key, value]) => !commonKeys.includes(key) && value !== null)
    .map(([key, value]) => {
      // 处理数组
      // 修改 renderDynamicFields 中的 Attributes 部分
      if (key === "Attributes" && Array.isArray(value)) {
        return (
          <div key={key} className="col-span-2 px-2">
            <h5 className="text-[15px] font-bold text-black tracking-wide mb-2">
              Data Fields ({value.length})
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {value.map((attr: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-black text-[14px]">
                      {attr.name}
                    </span>
                    <span className="text-[12px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                      {attr.type}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[14px] text-black">
                    <span>
                      Unique:{" "}
                      <span className="text-gray-500 italic">{attr.unique_count}</span>
                    </span>
                    <span>
                      Null:{" "}
                      <span
                        className={
                          attr.null_count > 0
                            ? "text-red-500 italic"
                            : "text-gray-500 italic"
                        }
                      >
                        {attr.null_count}
                      </span>
                    </span>
                  </div>
                  {attr.stats && (
                    <div className="mt-2 border-t border-slate-50 grid grid-cols-3 gap-1 text-[14px]">
                      <div className="text-black text-center">
                        Min{" "}
                        <span className="block text-slate-500 font-medium">
                          {attr.stats.min}
                        </span>
                      </div>
                      <div className="text-black text-center">
                        Max{" "}
                        <span className="block text-slate-500 font-medium">
                          {attr.stats.max}
                        </span>
                      </div>
                      <div className="text-black text-center">
                        Avg{" "}
                        <span className="block text-slate-500 font-medium">
                          {attr.stats.mean?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === "Geometry_type" && typeof value === "object" && value !== null && "Type" in value
      ) {
        return (
          <div
            key={key}
            className="col-span-2 bg-slate-800 text-slate-100 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-slate-400 text-[12px] uppercase tracking-wider">
                Geometry
              </span>
              <span className="text-xl font-bold">{(value as any).Type}</span>
            </div>
            <div className="h-10 w-px bg-slate-700 mx-4" />
            <div className="flex flex-col">
              <span className="text-slate-400 text-[12px] uppercase tracking-wider">
                Features
              </span>
              <span className="text-xl font-bold font-mono">
                {(value as any).Feature_count}
              </span>
            </div>
            <div className="ml-auto">
              {(value as any).Is_all_valid ? (
                <div className="flex items-center gap-1 text-green-400 text-[12px] bg-green-400/10 px-2 py-1 rounded">
                  <CheckCircle2 size={14} /> Topology Valid
                </div>
              ) : (
                <div className="text-red-400 text-[12px]">
                  Invalid: {(value as any).Invalid_count}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (key === "Resolution" && typeof value === "object" && !Array.isArray(value)) {
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

      // 处理嵌套对象
      if (typeof value === "object" && !Array.isArray(value)) {
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
      if (typeof value === "number" && Math.abs(value) > 1e10) {
        return (
          <ProfileItem
            key={key}
            label={key}
            value={
              <span className="text-red-400 font-mono text-[10px]">
                Out of range
              </span>
            }
          />
        );
      }

      // 普通字段
      return <ProfileItem key={key} label={key} value={String(value)} />;
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

function renderFinalProfile(p: any) {
  if (!p) return null;
  
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
            Form | {p.Form}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 bg-slate-50/30">
        <div className="mb-6 bg-red-50/50 p-4 rounded-xl border border-red-700">
          <div className="text-[14px] text-black font-medium leading-relaxed mb-2">
            <span className="font-bold mr-2 text-red-700">Abstract:</span>
            {p.Semantic.Abstract}
          </div>
          <div className="text-[14px] text-black font-medium leading-relaxed mb-2">
            <span className="font-bold mr-2 text-red-700">Application:</span>
            {p.Semantic.Applications}
          </div>
          <div className="flex flex-wrap gap-2">
            {p.Semantic.Tags?.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-red-700 border border-red-700 text-white text-[12px] rounded-full shadow-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 第一部分：空间域 */}
        {p.Spatial && (
          <section className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-full"></div>
            <h4 className="text-[16px] font-bold text-blue-700 tracking-wide flex items-center gap-2">
              Spatial Domain{" "}
              <span className="h-px flex-1 bg-linear-to-r from-blue-700 via-blue-100 to-transparent"></span>
            </h4>
            <div className="grid grid-cols-1 gap-2 mb-2">
              {p.Spatial.Crs && typeof p.Spatial.Crs === "object" ? (
                <div className="col-span-2">
                  <div className="col-span-2 flex flex-col px-2 mb-2 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100">
                    <span className="text-[15px] font-black text-black tracking-wide">
                      CRS
                    </span>
                    <span className="text-[14px] text-gray-500 italic pt-2">
                      {p.Spatial.Crs.Name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col px-2 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100">
                      <span className="text-[15px] text-black font-bold">
                        Datum_plane
                      </span>
                      <span className="text-[14px] text-gray-500 italic pt-2">
                        {p.Spatial.Crs.Datum}
                      </span>
                    </div>
                    <div className="flex flex-col px-2 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100">
                      <span className="text-[15px] text-black font-bold">
                        Central_meridian
                      </span>
                      <span className="text-[14px] text-gray-500 italic pt-2">
                        {p.Spatial.Crs.Central_meridian}
                      </span>
                    </div>
                    <div className="flex flex-col px-2 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100">
                      <span className="text-[15px] text-black font-bold">
                        Projection_method
                      </span>
                      <span className="text-[14px] text-gray-500 italic pt-2">
                        {p.Spatial.Crs.Projection}
                      </span>
                    </div>
                    <div className="flex flex-col px-2 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100">
                      <span className="text-[15px] text-black font-bold">
                        Unit
                      </span>
                      <span className="text-[14px] text-gray-500 italic pt-2">
                        {p.Spatial.Crs.Unit}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <ProfileItem
                  label="CRS"
                  value={String(p.Spatial.Crs?.Wkt || "Unknown")}
                  isCode
                />
              )}
            </div>

            {p.Spatial.Extent && (
              <div className="mt-2 px-2">
                <div className="text-[15px] font-bold text-black mb-2">
                  Extent
                </div>

                <div className="grid grid-cols-1 gap-y-1">
                  {/* 横向范围 */}
                  <div className="flex justify-start items-center">
                    <span className="text-[15px] text-black">
                      {p.Spatial.Extent.label_x}:
                    </span>
                    <code className="px-2 py-1 text-[15px] text-gray-500 italic">
                      {p.Spatial.Extent.min_x?.toLocaleString()} ~{" "}
                      {p.Spatial.Extent.max_x?.toLocaleString()}{" "}
                      {p.Spatial.Extent.unit}
                    </code>
                  </div>

                  {/* 纵向范围 */}
                  <div className="flex justify-start items-center">
                    <span className="text-[15px] text-black">
                      {p.Spatial.Extent.label_y}:
                    </span>
                    <code className="px-2 py-1 text-[15px] text-gray-500 italic">
                      {p.Spatial.Extent.min_y?.toLocaleString()} ~{" "}
                      {p.Spatial.Extent.max_y?.toLocaleString()}{" "}
                      {p.Spatial.Extent.unit}
                    </code>
                  </div>

                  {/* 跨度计算（这是用户最能看懂的：这块地有多大） */}
                  <div className="mt-1 pt-2 border-t border-dashed border-slate-300 text-[13px] text-blue-600 italic">
                    Dimension span:{" "}
                    {(
                      p.Spatial.Extent?.max_x - p.Spatial.Extent?.min_x
                    ).toFixed(2)}{" "}
                    ×{" "}
                    {(
                      p.Spatial.Extent?.max_y - p.Spatial.Extent?.min_y
                    ).toFixed(2)}{" "}
                    ({p.Spatial.Extent?.unit})
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 第二部分：时间域 */}
        {p.Temporal && (
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
        )}

        {/* 第三部分：动态特有属性 */}
        <section className="relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-full"></div>
          <h4 className="text-[16px] font-bold text-green-600 tracking-wide flex items-center gap-2">
            Special Attributes{" "}
            <span className="h-px flex-1 bg-linear-to-r from-green-600 via-green-100 to-transparent"></span>
          </h4>
          <div className="grid grid-cols-2 gap-1">{renderDynamicFields(p)}</div>
        </section>
      </div>

      {/* 底部装饰 */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
        <span>AUTO-GENERATED BY AGENT</span>
        <span>CONFIDENCE: {(p.Confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function ToolTimeline({ msg }: { msg: any }) {
  const events = msg.tools || [];
  const finalProfile = msg.profile;

  return (
    <div className="relative space-y-4">
      <AnimatePresence>
        {events.map((event: ToolEvent) => (
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

        {finalProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-4 border-t border-slate-100"
          >
            {renderFinalProfile(finalProfile)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
