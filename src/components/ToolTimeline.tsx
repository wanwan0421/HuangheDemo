import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, FileText, Database, Globe2, Clock, BarChart3, Target, ShieldCheck, AlertTriangle } from "lucide-react";
import type { ToolEvent } from "../types";

// 区块标题组件
function SectionHeader({ title, icon: Icon, colorClass = "text-blue-700" }: { title: string; icon?: any; colorClass?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-2">
      <div className={`w-1 h-5 rounded-full ${colorClass.replace('text', 'bg')}`} />
      {Icon && <Icon size={16} className={colorClass} />}
      <h4 className={`text-sm font-bold text-[15px] tracking-wide ${colorClass}`}>
        {title}
      </h4>
      <span className={`h-px flex-1 bg-linear-to-r ${colorClass.replace('text', 'from')} via-blue-100 to-transparent`}></span>
    </div>
  );
}

// 属性统计的标签组件
function StatBadge({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-1.5 px-1 bg-slate-200/50 rounded-lg border border-slate-300">
      <span className="text-[13px] text-slate-400 font-bold mb-0.5">{label}</span>
      <span className="text-[13px] text-slate-800 font-bold leading-none">{value}</span>
    </div>
  );
}

// 渲染工具事件结果
const DETAIL_IN_RIGHT_PANEL_TOOLS = new Set([
  "search_most_model",
  "get_model_details",
]);

const RESULT_FIELD_LABELS: Record<string, string> = {
  status: "状态",
  fileName: "文件",
  file_type: "类型",
  primary_file: "主文件",
  file_path: "路径",
  count: "数量",
  total: "总数",
};

function formatResultValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `${value.length} 项`;
  return null;
}

function getResultSummaryEntries(result: unknown) {
  if (!result || typeof result !== "object" || Array.isArray(result)) return [];
  const record = result as Record<string, unknown>;

  return Object.keys(RESULT_FIELD_LABELS)
    .map((key) => {
      const value = formatResultValue(record[key]);
      return value ? { key, label: RESULT_FIELD_LABELS[key], value } : null;
    })
    .filter(Boolean)
    .slice(0, 4) as Array<{ key: string; label: string; value: string }>;
}

function renderResult(e: ToolEvent) {
  if (DETAIL_IN_RIGHT_PANEL_TOOLS.has(e.kind)) {
    return null;
  }

  if (e.status === "error" && e.result) {
    const errorMsg =
      typeof e.result === "string"
        ? e.result
        : e.result?.error?.message || JSON.stringify(e.result);

    return (
      <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-700 wrap-break-word">
        {errorMsg}
      </div>
    );
  }

  // 指标库：只显示 name_en / name_cn
  if (e.kind === "search_relevant_indices" && Array.isArray(e.result?.indices)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {e.result.indices.map((i: any, idx: number) => (
          <span
            key={idx}
            className="inline-flex max-w-full items-center rounded-md border border-blue-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
            title={i.name_cn || i.name_en}
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
      <div className="flex gap-1.5 flex-wrap">
        {e.result.models.map((m: any, idx: number) => (
          <span
            key={idx}
            className="inline-flex max-w-full items-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-gray-900"
            title={m.modelName}
          >
            {m.modelName}
          </span>
        ))}
      </div>
    );
  }

  if (typeof e.result === "string") {
    return (
      <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm leading-relaxed text-gray-900">
        {e.result}
      </div>
    );
  }

  const summaryEntries = getResultSummaryEntries(e.result);

  if (summaryEntries.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {summaryEntries.map((item) => (
          <div
            key={item.key}
            className="min-w-0 rounded-md border border-blue-100 bg-blue-50 px-3 py-2"
          >
            <div className="text-xs font-bold text-blue-500">
              {item.label}
            </div>
            <div className="truncate text-sm font-semibold text-slate-800" title={item.value}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function renderDynamicFields(profile: any) {
  const commonKeys = ['Form', 'Spatial', 'Temporal', 'file_path', 'file_type', 'primary_file', 'Confidence', 'status', 'Semantic', "Quality", "primary_file", "data_sources", "Validation"];
  
  const entries = Object.entries(profile).filter(
    ([key, value]) => !commonKeys.includes(key) && value !== null
  );

  // 分类：重型组件 vs 基础字段
  const heavyKeys = ["Attributes", "Geometry_type", "Resolution", "Statistics"];
  const heavyFields = entries.filter(([key]) => heavyKeys.includes(key));
  const lightFields = entries.filter(([key]) => !heavyKeys.includes(key));

  return (
    <div className="col-span-2 space-y-3">
      {/* --- 第一层级：重型结构组件 --- */}
      {heavyFields.map(([key, value]) => {
        // A. Data Fields (Attributes)
        if (key === "Attributes" && Array.isArray(value)) {
          return (
            <div key={key} className="space-y-3 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-1">
                <div className="text-[14px] font-bold text-black tracking-wide">
                  Data Fields ({value.length})
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {value.map((attr: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-blue-50/50 border border-slate-200 p-3 rounded-2xl shadow-sm hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center mb-3 gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-slate-900 text-[13px]">
                        {attr.name}
                      </span>
                      <span className="text-[12px] px-2 py-0.5 bg-slate-200 text-slate-500 rounded font-bold">
                        {attr.type}
                      </span>
                    </div>
                    <div className="flex gap-4 mb-3">
                      <div className="text-[13px] flex gap-1">
                        <span className="text-black">Unique:</span>
                        <span className="font-bold text-slate-400">{attr.unique_count}</span>
                      </div>
                      <div className="text-[13px] flex gap-1">
                        <span className="text-black">Null:</span>
                        <span
                          className={`font-bold ${
                            attr.null_count > 0 ? "text-red-500" : "text-slate-400"
                          }`}
                        >
                          {attr.null_count}
                        </span>
                      </div>
                    </div>
                    {attr.stats && (
                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-50">
                        <StatBadge label="Min" value={attr.stats.min} />
                        <StatBadge label="Max" value={attr.stats.max} />
                        <StatBadge
                          label="Avg"
                          value={attr.stats.mean?.toFixed(2)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // B. Geometry Type
        if (key === "Geometry_type") {
          const geo = value as any;
          return (
            <div
              key={key}
              className="grid grid-cols-1 md:grid-cols-4 px-3 py-2 rounded-xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden"
            >
              <div className="absolute right-[-10%] bottom-[-20%] opacity-10 rotate-12">
                <Database size={160} />
              </div>
              <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="flex flex-col justify-center items-center space-y-2">
                  <p className="text-[13px] text-white font-bold tracking-wide">
                    Geometry Entity
                  </p>
                  <p className="text-[13px] text-blue-500 font-bold leading-none">
                    {geo.Type}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-col justify-center items-center space-y-2">
                  <p className="text-[13px] text-white font-bold tracking-wide">
                    Feature Count
                  </p>
                  <p className="text-[13px] text-blue-500 font-bold leading-none">
                    {geo.Feature_count?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // C. Resolution
        if (key === "Resolution") {
          const res = value as any;
          return (
            <div key={key} className="grid grid-cols-1 md:grid-cols-4 px-3 py-2 border border-slate-200 rounded-xl text-black shadow-sm">
              <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-slate-900">
                <div className="flex flex-col justify-center items-center space-y-2">
                  <p className="text-[13px] text-slate-400 font-bold tracking-wide">
                    Resolution X
                  </p>
                  <p className="text-[13px] text-slate-800 font-bold leading-none">
                    {`${Number(res.x).toFixed(4)}`}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-col justify-center items-center space-y-2">
                  <p className="text-[13px] text-slate-400 font-bold tracking-wide">
                    Resolution Y
                  </p>
                  <p className="text-[13px] text-slate-800 font-bold leading-none">
                    {`${Number(res.y).toFixed(4)}`}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // D. Statistics
        if (key === "Statistics" && typeof value === "object") {
          const stats = value as any;
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-blue-300" />
                <span className="text-[14px] font-bold text-black tracking-wide">Statistics</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBadge label="Min" value={stats.min?.toFixed(5)} />
                <StatBadge label="Max" value={stats.max?.toFixed(5)} />
                <StatBadge label="Mean" value={stats.mean?.toFixed(5)} />
                <StatBadge label="Std" value={stats.std?.toFixed(5)} />
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* --- 第二层级：轻量元数据收纳箱 (Metadata Compactor) --- */}
      {lightFields.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <div className="flex items-center text-[14px] font-black text-black gap-2 mb-2">
            <Target size={16} className="text-blue-300" />
            <span className="text-[14px] font-bold text-black tracking-wide">Supplementary Metadata</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-8">
            {lightFields.map(([key, value]) => {
              const displayValue = String(typeof value === 'number' ? value.toFixed(2) : value);
              return (
                <div key={key}>
                  <span className="text-[13px] text-slate-400 font-bold block">{key.replace(/_/g, ' ')}</span>
                  <span 
                    className="text-[13px] font-black text-slate-800 truncate leading-tight block cursor-help"
                    title={displayValue}
                  >
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function renderFinalProfile(p: any) {
  if (!p) return null;
  const semantic = p?.Semantic ?? {};
  const spatial = p?.Spatial ?? {};
  const temporal = p?.Temporal ?? null;
  const quality = p?.Quality ?? null;
  const confidence = typeof p?.Confidence === "number" ? p.Confidence : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl w-full mb-2">
      {/* 头部 */}
      <div className="bg-slate-900 px-4 py-2 flex justify-between items-center">
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
            Form | {p?.Form || "Unknown"}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 bg-slate-50/20">
        {/* 语义摘要区 */}
        <section className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <FileText size={100} />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1.5 text-[14px] tracking-wide">
                Abstract
              </span>
              <div className="flex text-justify text-gray-800 text-[13px]">
                {semantic?.Abstract || "No abstract available."}
              </div>
            </div>
            {Array.isArray(semantic?.Applications) && semantic.Applications.length > 0 && (
              <div className="text-black leading-relaxed text-[14px]">
                <span className="font-bold text-slate-900 block mb-1.5 text-[14px] tracking-wide">
                  Applications
                </span>
                <div className="flex flex-wrap text-gray-800 text-[13px]">
                  {semantic.Applications.map((app: string, idx: number) => (
                    <span key={idx}>
                      {idx > 0 && <span className="mx-1">|</span>}
                      <span>{app}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              {Array.isArray(semantic?.Tags) &&
                semantic.Tags.length > 0 &&
                semantic.Tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          </div>
        </section>

        {/* 空间域 */}
        <section>
          <SectionHeader
            title="Spatial Domain"
            icon={Globe2}
            colorClass="text-blue-700"
          />
          <div className="space-y-2">
            {/* 第一组：坐标系核心定义 (横向长条卡片) */}
            <div className="grid grid-cols-1 md:grid-cols-7 px-4 py-2 rounded-xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10%] bottom-[-20%] opacity-10 rotate-12">
                <Globe2 size={160} />
              </div>
              <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100">
                <span className="text-[14px] font-bold tracking-wide block mb-2">
                  Coordinate Reference System
                </span>
                <div className="text-[14px] font-bold text-blue-500 leading-tight">
                  {spatial?.Crs?.Name || "Unknown Reference"}
                </div>
                <div className="flex flex-col pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[12px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Datum:{" "}
                    <span className="text-slate-200 font-bold">
                      {spatial?.Crs?.Datum || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[12px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Unit:{" "}
                    <span className="text-slate-200 font-bold">
                      {spatial?.Crs?.Unit || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 flex flex-col justify-start px-3 mt-4 md:mt-0 gap-2">
                <span className="text-[14px] font-bold justify-between">Projection Method</span>
                <span className="text-[14px] font-bold text-blue-500 leading-tight">
                  {spatial?.Crs?.Projection || "Geographic"}
                </span>
              </div>
            </div>

            {/* 第二组：Bounding Box (特殊的地理视觉组件) */}
            {spatial?.Extent && (
              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                <span className="text-[14px] font-black text-black tracking-wide block">
                  Extent
                </span>
                <div className="grid grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-black text-[13px]">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {spatial.Extent.label_x}
                    </div>
                    <div
                      className={
                        "h-px bg-linear-to-r from-blue-500 via-blue-100 to-transparent"
                      }
                    />
                    <div className="text-[12px] text-slate-400 tracking-tight italic">
                      {spatial.Extent.min_x?.toFixed(3)}
                      <span className="text-slate-500 mx-1">~</span>
                      {spatial.Extent.max_x?.toFixed(3)}{" "}
                      {spatial.Extent.unit}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-black text-[13px]">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      {spatial.Extent.label_y}
                    </div>
                    <div
                      className={
                        "h-px bg-linear-to-r from-indigo-500 via-indigo-100 to-transparent"
                      }
                    />
                    <div className="text-[12px] text-slate-400 tracking-tight italic">
                      {spatial.Extent.min_y?.toFixed(3)}
                      <span className="text-slate-500 mx-1">~</span>
                      {spatial.Extent.max_y?.toFixed(3)}{" "}
                      {spatial.Extent.unit}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 时间域 */}
        {temporal && (
          <section>
            <SectionHeader
              title="Temporal Domain"
              icon={Clock}
              colorClass="text-blue-700"
            />
            <div className="grid grid-cols-1 md:grid-cols-7 px-4 py-2 rounded-xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10%] bottom-[-20%] opacity-10 rotate-12">
                <Globe2 size={160} />
              </div>
              <div className="md:col-span-3 md:border-r border-slate-100">
                <span className="text-[14px] font-bold tracking-wide block mb-2">
                  Timeline Status
                </span>
                <div className="text-[14px] font-bold text-blue-500 leading-tight">
                  {
                    temporal?.Has_time
                      ? "Time-Series Enabled"
                      : "Static Snapshot"
                  }
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col px-3 md:border-r border-slate-100">
                <span className="text-[14px] font-bold tracking-wide block mb-2">Start Time</span>
                <span className="text-[14px] font-bold text-blue-500 leading-tight">
                  {temporal?.Start_time || "N/A"}
                </span>
              </div>
              <div className="md:col-span-2 flex flex-col px-3">
                <span className="text-[14px] font-bold tracking-wide block mb-2">End Time</span>
                <span className="text-[14px] font-bold text-blue-500 leading-tight">
                  {temporal?.End_time || "N/A"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 技术特有属性 */}
        <section>
          <SectionHeader
            title="Technical Attributes"
            icon={Database}
            colorClass="text-blue-700"
          />
          <div className="grid grid-cols-2 gap-3">{renderDynamicFields(p)}</div>
        </section>

        {/* 质量哨兵 */}
        {quality && (
          <section>
            <SectionHeader
            title="Quality Detection"
            icon={ShieldCheck}
            colorClass="text-blue-700"
          />
            <div className="space-y-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute right-[-10%] bottom-[-20%] text-slate-200 opacity-30 rotate-12">
                <ShieldCheck size={160} />
              </div>
              {/* 核心质量状态卡片 */}
              <div
                className={`px-4 py-2 rounded-xl border flex flex-col md:flex-row gap-6 transition-all shadow-sm ${
                  quality.status === "healthy"
                    ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-200"
                    : "bg-amber-50/30 border-amber-100 hover:border-amber-200"
                }`}
              >
                {/* 左侧：无数据率仪表 */}
                <div className="flex flex-col items-center justify-center px-4 md:border-r border-slate-200/60">
                  <span className="text-[12px] font-bold text-black uppercase tracking-wide mb-2">
                    No-Data Ratio
                  </span>
                  <div className="relative flex items-center justify-center">
                    {/* 简易环形进度条效果 */}
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-slate-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={175}
                        strokeDashoffset={
                          175 -
                          (175 *
                            parseFloat(quality.nodata_percentage || "0")) /
                            100
                        }
                        className={
                          quality.status === "healthy"
                            ? "text-emerald-500"
                            : "text-amber-500"
                        }
                      />
                    </svg>
                    <span className="absolute text-[13px] font-black text-slate-700">
                      {quality.nodata_percentage}
                    </span>
                  </div>
                </div>

                {/* 右侧：问题诊断列表 */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[13px] font-black tracking-wide ${
                        quality.status === "healthy"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {quality.status === "healthy"
                        ? "Data Integrity: Verified"
                        : "Anomalies Detected"}
                    </span>
                    {quality.requires_repair && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full border border-red-200 animate-pulse">
                        REPAIR REQUIRED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(quality.issues) && quality.issues.length > 0 ? (
                      quality.issues.map((issue: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-xs"
                        >
                          <AlertTriangle size={12} className="text-amber-500" />
                          <span className="text-[12px] text-slate-600 font-medium lowercase tracking-tight">
                            {issue.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 border border-emerald-100 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[12px] text-emerald-700 font-medium">
                          Geometric & Attribute validity passed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 底部信息：置信度与脚注 */}
      <div className="bg-slate-50 px-6 py-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-[8px] text-slate-400 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} AI ANALYSIS AGENT • NO_DATA_LEAKAGE
        </span>
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black text-slate-500 tracking-wider">
            Confidence
          </span>
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence * 100}%` }}
              className="h-full bg-blue-700 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
          </div>
          <span className="text-[12px] font-black text-blue-700">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function FinalProfileCard({ profile }: { profile: any }) {
  return renderFinalProfile(profile);
}

type ToolTimelineProps = {
  msg: {
    tools?: ToolEvent[];
    profile?: unknown;
  };
  className?: string;
};

export default function ToolTimeline({
  msg,
  className = "",
}: ToolTimelineProps) {
  const events = msg.tools || [];
  const finalProfile = msg.profile;
  const hasFinalProfile = finalProfile !== null && finalProfile !== undefined;

  return (
    <div
      className={`w-full rounded-xl border border-blue-200 bg-white p-4 shadow-sm ${className}`}
    >
      {(events.length > 0 || hasFinalProfile) && (
        <div>
          {events.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={20} className="text-blue-600" />
                <span className="font-bold text-xl text-blue-600">
                  Tool execution
                </span>
              </div>
              <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>
            </>
          )}

          <AnimatePresence>
            {events.length > 0 && (
            <div className="space-y-0">
              {events.map((event: ToolEvent, index: number) => {
                const resultNode = event.result ? renderResult(event) : null;
                const stateClasses =
                  event.status === "running"
                    ? {
                        item: "bg-blue-50/60 border-blue-200",
                        dot: "bg-blue-500 border-white",
                        icon: "bg-blue-600 text-white",
                        badge: "border-blue-200 bg-white text-blue-700",
                      }
                    : event.status === "success"
                    ? {
                        item: "bg-white border-gray-100",
                        dot: "bg-blue-500 border-white",
                        icon: "bg-blue-50 text-blue-700",
                        badge: "border-blue-200 bg-blue-50 text-blue-700",
                      }
                    : {
                        item: "bg-red-50 border-red-100",
                        dot: "bg-red-500 border-white",
                        icon: "bg-red-50 text-red-700",
                        badge: "border-red-200 bg-white text-red-700",
                      };

                return (
                  <div
                    key={event.id}
                    className={`relative ${index !== 0 ? "mt-3" : ""}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-lg border p-3 transition-all duration-200 ${stateClasses.item}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${stateClasses.icon}`}
                        >
                          {event.status === "running" && (
                            <Loader2 size={16} className="animate-spin" />
                          )}
                          {event.status === "success" && <CheckCircle2 size={16} />}
                          {event.status === "error" && <XCircle size={16} />}
                        </div>

                        <div className="flex-1">
                          <div className="flex mt-0.5 items-center gap-2">
                            <p className="text-base font-semibold text-gray-800">
                              {event.title}
                            </p>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateClasses.badge}`}
                            >
                              {event.status === "running"
                                ? "运行中"
                                : event.status === "success"
                                ? "完成"
                                : "异常"}
                            </span>
                          </div>

                          {/* 结果展示 */}
                          {resultNode && (
                            <div className="mt-2 text-slate-700">
                              {resultNode}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
            )}

            {hasFinalProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 border-t border-blue-100 pt-3"
              >
                {renderFinalProfile(finalProfile)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
