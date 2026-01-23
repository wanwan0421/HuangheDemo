import React from "react";
import {Globe2, Target, Map, History, Layers, ClipboardCheck} from "lucide-react";
import { motion } from "framer-motion";

interface TaskSpecProps {
  data: {
    Domain?: string;
    Target_object?: string;
    Spatial_scope?: string;
    Temporal_scope?: string;
    Resolution_requirements?: string;
  };
}

const TaskSpecCard: React.FC<TaskSpecProps> = ({ data }) => {
  // 定义展示项及其对应的图标与标签
  const items = [
    { icon: <Globe2 size={16} />, label: "Research Domain", value: data.Domain },
    { icon: <Target size={16} />, label: "Target Object", value: data.Target_object },
    { icon: <Map size={16} />, label: "Spatial Scope", value: data.Spatial_scope },
    { icon: <History size={16} />, label: "Temporal Scope", value: data.Temporal_scope },
    { icon: <Layers size={16} />, label: "Resolution", value: data.Resolution_requirements },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm mb-3"
    >
      {/* 顶部状态栏 */}
      <div className="flex items-center gap-2 border-b border-gray-50 mb-1">
        <ClipboardCheck size={20} className="text-blue-800" />
        <span className="font-bold text-2xl text-blue-800">Task requirements</span>
      </div>
      <div className="h-px w-full ml-1 mb-3 bg-linear-to-r from-blue-800 via-blue-500 to-transparent"></div>

      {/* 核心字段网格 - 自动适配列数 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex items-center gap-1.5 text-blue-600 text-[14px] font-bold mb-1">
              {item.icon}
              {item.label}
            </div>
            <div className="text-[14px] text-black bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100/50 h-full">
              {item.value || "Unspecified"}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TaskSpecCard;