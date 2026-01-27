import React from "react";
import { motion } from "framer-motion";
import {Database, Globe2, Clock, FileText, Frame, LaptopMinimalCheck, MapPin, Maximize, Combine} from "lucide-react";

// --- 类型定义保持不变 ---
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

// --- 紧凑的小组件 ---

// 类型徽章
function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    REAL: "bg-blue-100 text-blue-700 border-blue-200",
    INTEGER: "bg-indigo-100 text-indigo-700 border-indigo-200",
    STRING: "bg-purple-100 text-purple-700 border-purple-200",
    FILE: "bg-green-100 text-green-700 border-green-200",
    BOOLEAN: "bg-pink-100 text-pink-700 border-pink-200",
    Raster: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Vector: "bg-cyan-100 text-cyan-700 border-cyan-200",
  };

  const style =
    colorMap[type] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border rounded-md ${style}`}
    >
      {type}
    </span>
  );
}

// 信息块组件 (用于网格中的单个单元)
function InfoBlock({ icon: Icon, label, children, className = ""}: { icon: React.ElementType; label: string; children: React.ReactNode; className?: string}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-slate-700">
        <Icon size={14} strokeWidth={2.5} />
        <span className="text-[14px] font-bold tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-[14px] text-slate-500 leading-relaxed wrap-break-word">
        {children || <span className="text-slate-300">-</span>}
      </div>
    </div>
  );
}

// --- 主卡片组件 ---
function ContractCard({ contract }: { contract: ModelContractItem }) {
  // 数据读取辅助
  const name = contract.Input_name || contract.slot_name || "Unknown Input";
  const type = contract.Data_type || contract.original_type || "Parameter";
  const semantic = contract.Semantic_requirement || contract.semantic_requirement;
  const temporal = contract.Temporal_requirement || contract.temporal_requirement;
  const format = contract.Format_requirement || contract.format_requirement;
  
  const spatialObj = contract.Spatial_requirement || contract.spatial_requirement;
  const region = spatialObj?.Region || spatialObj?.region;
  const crs = spatialObj?.Crs || spatialObj?.crs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-lg border border-slate-300 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200 overflow-hidden mb-3"
    >
      {/* 头部：极其紧凑，类似代码编辑器的顶栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="text-blue-600">
            <LaptopMinimalCheck size={16} />
          </div>
          <span className="text-[16px] font-semibold text-black tracking-wide">
            {name}
          </span>
        </div>
        <TypeBadge type={type} />
      </div>

      {/* 内容区域：网格布局 */}
      <div className="px-4 py-2 grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-4">
        
        {/* 1. 语义描述*/}
        <div className="md:col-span-12 lg:col-span-12 p-2.5">
          <InfoBlock icon={Frame} label="Semantic description">
             {semantic}
          </InfoBlock>
        </div>

        {/* 分割线 (仅在移动端显示，为了视觉分隔) */}
        <div className="block md:hidden h-px bg-slate-100 col-span-1" />

        {/* 2. 空间域 (Region & CRS) */}
        <div className="flex flex-col md:col-span-4 bg-slate-50/50 p-2.5 gap-1 rounded-md border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Frame size={14} strokeWidth={2.5} />
            <span className="text-[14px] font-bold tracking-wide">Spatial requirement</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-1 text-blue-400 shrink-0" />
              <span className="text-[14px] text-slate-500 leading-relaxed">
                 <span className="text-slate-500 mr-1 font-semibold">REG:</span>
                 {region || "N/A"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Maximize size={14} className="mt-1 text-blue-400 shrink-0" />
              <span className="text-[14px] text-slate-500 leading-relaxed">
                <span className="text-slate-500 mr-1 font-semibold">CRS:</span>
                {crs || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. 时间域 */}
        <div className="md:col-span-4 bg-slate-50/50 p-2.5 rounded-md border border-slate-100/50">
          <InfoBlock icon={Frame} label="Temporal requirement" >
            {temporal}
          </InfoBlock>
        </div>

        {/* 4. 格式要求 */}
        <div className="md:col-span-4 bg-slate-50/50 p-2.5 rounded-md border border-slate-100/50">
          <InfoBlock icon={Frame} label="Format requirement">
             <span className="font-mono text-[14px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
                {format || "Standard"}
             </span>
          </InfoBlock>
        </div>
      </div>
    </motion.div>
  );
}

// --- 容器组件 ---
export default function ModelContract({contracts}: { contracts: ModelContractItem[] | { Required_slots?: ModelContractItem[] } | any;}) {
  let contractArray: ModelContractItem[] = [];
  
  if (Array.isArray(contracts)) {
    contractArray = contracts;
  } else if (contracts?.Required_slots && Array.isArray(contracts.Required_slots)) {
    contractArray = contracts.Required_slots;
  } else if (contracts && typeof contracts === "object") {
    contractArray = (Object.values(contracts) as unknown[]).filter(isModelContractItem);
  }

  if (!contractArray?.length) return null;

  return (
    <div className="w-full">
      {/* 总标题 */}
      <div className="flex items-center gap-2 mb-1">
        <Combine size={20} className="text-blue-800" />
        <span className="font-bold text-[22px] text-blue-800">
          Inputdata specification <span className="text-slate-400 font-normal ml-1 text-[14px]">({contractArray.length})</span>
        </span>
      </div>
      <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>

      {/* 紧凑列表 */}
      <div className="space-y-3">
        {contractArray.map((contract, idx) => (
          <ContractCard
            key={`${contract.Input_name || contract.slot_name || idx}`}
            contract={contract}
          />
        ))}
      </div>
    </div>
  );
}