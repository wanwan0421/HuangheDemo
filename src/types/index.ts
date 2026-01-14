// 定义工作流输入数据
export interface WorkflowInput {
  name: string;
  key: string;
  type: string;
  description: string;
}

// 定义工作流事件
export interface WorkflowEvent {
  eventName: string;
  eventDescription: string;
  inputs: WorkflowInput[];
}

// 定义工作流状态
export interface WorkflowState {
  stateName: string;
  stateDescription: string;
  events: WorkflowEvent[];
}

// 定义消息类型
export interface Message {
  id: string;
  role: "user" | "AI";
  content: string;
  type?: "text" | "tool" | "data"; // 区分消息类型
  tools?: ToolEvent[]; // 如果是tool类型存放工具数据
  started?: boolean;
}

// 定义AI返回工具事件类型
export interface ToolEvent {
  id: string;
  status: "running" | "success" | "error";
  title: string;
  kind:
    | "search_relevant_indices"
    | "search_relevant_models"
    | "get_model_details"
    | "tool_prepare_file"
    | "tool_detect_format"
    | "tool_analyze_raster"
    | "tool_analyze_vector"
    | "tool_analyze_table"
    | "tool_analyze_timeseries"
    | "tool_analyze_parameter"
    | "tool_generate_profile";
  result?: any;
}
