import React from "react";
import { motion } from "framer-motion";
import {
  Database,
  Globe2,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Type,
} from "lucide-react";

interface SpatialRequirement {
  Region?: string;
  region?: string;
  Crs?: string;
  crs?: string;
}

interface ModelContractItem {
  Input_name?: string;
  slot_name?: string;
  Data_type?: string;
  original_type?: string;
  Semantic_requirement?: string;
  semantic_requirement?: string;
  Spatial_requirement?: SpatialRequirement;
  spatial_requirement?: SpatialRequirement;
  Temporal_requirement?: string;
  temporal_requirement?: string;
  Format_requirement?: string;
  format_requirement?: string;
}

function isModelContractItem(value: unknown): value is ModelContractItem {
  return typeof value === "object" && value !== null;
}

// 区块标题组件
function SectionHeader({
  title,
  icon: Icon,
  colorClass = "text-blue-700",
}: {
  title: string;
  icon?: any;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <div className={`w-1 h-5 rounded-full ${colorClass.replace("text", "bg")}`} />
      {Icon && <Icon size={16} className={colorClass} />}
      <h4 className={`text-sm font-bold text-[15px] tracking-wide ${colorClass}`}>
        {title}
      </h4>
      <span
        className={`h-px flex-1 bg-linear-to-r ${colorClass.replace(
          "text",
          "from"
        )} via-blue-100 to-transparent`}
      ></span>
    </div>
  );
}

// 字段展示组件
function ProfileField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all duration-200 ${className}`}
    >
      <span className="text-[14px] font-bold text-slate-400 tracking-wide leading-none">
        {label.replace(/_/g, " ")}
      </span>
      <div className="text-[14px] text-black font-semibold break-all">
        {value}
      </div>
    </div>
  );
}

// 类型徽章
function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    REAL: { bg: "bg-blue-100", text: "text-blue-700" },
    INTEGER: { bg: "bg-indigo-100", text: "text-indigo-700" },
    STRING: { bg: "bg-purple-100", text: "text-purple-700" },
    FILE: { bg: "bg-green-100", text: "text-green-700" },
    BOOLEAN: { bg: "bg-pink-100", text: "text-pink-700" },
    Raster: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Parameter: { bg: "bg-amber-100", text: "text-amber-700" },
    Vector: { bg: "bg-cyan-100", text: "text-cyan-700" },
  };

  const colors = colorMap[type] || { bg: "bg-slate-100", text: "text-slate-700" };

  return (
    <span className={`px-3 py-1 ${colors.bg} ${colors.text} text-[12px] font-bold rounded-full border border-current border-opacity-20`}>
      {type}
    </span>
  );
}

// 单个参数卡片
function ContractCard({ contract }: { contract: ModelContractItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl w-full mb-6"
    >
      {/* 头部：参数名称和类型 */}
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-400/20 p-1.5 rounded-lg border border-blue-400/30">
            <Type className="text-white w-5 h-5" />
          </div>
          <div>
            <span className="text-white text-[18px] font-bold tracking-wide">
              {contract.Input_name || contract.slot_name}
            </span>
          </div>
        </div>
        <TypeBadge type={contract.Data_type || contract.original_type || "Parameter"} />
      </div>

      <div className="p-6 space-y-6 bg-slate-50/20">
        {/* 语义需求区 */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <FileText size={100} />
          </div>
          <div className="relative z-10 space-y-2">
            <h4 className="text-black font-bold text-[14px] tracking-wide mb-2">
              语义需求 (Semantic Requirement)
            </h4>
            <p className="text-black leading-relaxed text-[14px] text-justify">
              {contract.Semantic_requirement || contract.semantic_requirement}
            </p>
          </div>
        </section>

        {/* 空间域 */}
        <section>
          <SectionHeader
            title="空间域 (Spatial Domain)"
            icon={Globe2}
            colorClass="text-blue-700"
          />
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 p-5 rounded-xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10%] bottom-[-20%] opacity-10 rotate-12">
                <Globe2 size={160} />
              </div>
              <div className="border-b md:border-b-0 md:border-r border-slate-100">
                <span className="text-[14px] font-bold tracking-wide block mb-2">
                  覆盖区域 (Region)
                </span>
                <div className="text-[14px] text-blue-300 leading-tight font-semibold">
                  {contract.Spatial_requirement?.Region || contract.spatial_requirement?.region || "N/A"}
                </div>
              </div>
              <div className="flex flex-col justify-start px-0 md:px-5 mt-4 md:mt-0 gap-2">
                <span className="text-[14px] font-bold">参考系统 (CRS)</span>
                <span className="text-[14px] text-blue-400 leading-tight font-bold">
                  {contract.Spatial_requirement?.Crs || contract.spatial_requirement?.crs || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 时间域 */}
        <section>
          <SectionHeader
            title="时间域 (Temporal Domain)"
            icon={Clock}
            colorClass="text-indigo-600"
          />
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Clock size={100} />
            </div>
            <div className="relative z-10">
              <p className="text-black leading-relaxed text-[14px] text-justify">
                {contract.Temporal_requirement || contract.temporal_requirement}
              </p>
            </div>
          </div>
        </section>

        {/* 格式需求 */}
        <section>
          <SectionHeader
            title="格式要求 (Format Requirement)"
            icon={Database}
            colorClass="text-amber-700"
          />
          <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-5 hover:border-amber-200 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
              <AlertCircle size={100} />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                <p className="text-black leading-relaxed text-[14px]">
                  {contract.Format_requirement || contract.format_requirement}
                </p>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-amber-100">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-[13px] text-slate-600 font-medium">
                  确保数值符合上述格式，便于模型读取和运算
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 底部：说明 */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[12px] text-slate-500 italic">
        该参数为模型关键输入，请严格按照上述要求准备数据
      </div>
    </motion.div>
  );
}

// 模型合约容器组件
export default function ModelContract({
  contracts,
}: {
  contracts: ModelContractItem[] | { Required_slots?: ModelContractItem[] } | any;
}) {
  // 处理多种数据格式
  let contractArray: ModelContractItem[] = [];
  
  if (Array.isArray(contracts)) {
    contractArray = contracts;
  } else if (contracts?.Required_slots && Array.isArray(contracts.Required_slots)) {
    contractArray = contracts.Required_slots;
  } else if (contracts && typeof contracts === "object") {
    const values = Object.values(contracts) as unknown[];
    contractArray = values.filter(isModelContractItem);
  }

  if (!contractArray || contractArray.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        暂无模型参数合约信息
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* 头部说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-900 font-bold text-[14px] mb-1">
              模型输入参数规范 (Model Input Parameters)
            </h3>
            <p className="text-blue-800 text-[13px] leading-relaxed">
              下列参数为该模型的必需输入。请按照各参数的语义、空间、时间和格式要求准备相应的数据，确保模型能够正确读取和处理输入数据。
            </p>
          </div>
        </div>
      </div>

      {/* 参数卡片列表 */}
      {contractArray.map((contract, idx) => (
        <ContractCard
          key={`${contract.Input_name || contract.slot_name || idx}`}
          contract={contract}
        />
      ))}
    </div>
  );
}
