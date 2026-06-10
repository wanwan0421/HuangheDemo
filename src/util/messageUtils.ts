import type { Message } from "../types";

export const TOOL_TITLE_MAP: Record<string, string> = {
  search_relevant_indices: "指标库检索完成",
  search_relevant_models: "模型库检索完成",
  search_most_model: "模型推荐完成",
  get_model_details: "详情读取完成",
  tool_prepare_file: "数据准备完成",
  tool_detect_format: "数据格式检测完成",
  tool_analyze_raster: "栅格数据分析完成",
  tool_analyze_vector: "矢量数据分析完成",
  tool_analyze_table: "表格数据分析完成",
  tool_analyze_timeseries: "时间序列数据分析完成",
  tool_analyze_parameter: "参数数据分析完成",
};

export const getPayloadToolKind = (payload: any): string => {
  return String(payload?.tool ?? payload?.name ?? payload?.tool_name ?? "").trim();
};

export const normalizeMessageText = (raw: any): string => {
  if (typeof raw === "string") return raw;

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if (typeof item.text === "string") return item.text;
          if (typeof item.content === "string") return item.content;
          if (typeof item.value === "string") return item.value;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (raw && typeof raw === "object") {
    if (typeof raw.text === "string") return raw.text;
    if (typeof raw.content === "string") return raw.content;
  }

  return "";
};

export const normalizeHistoryTools = (message: any): NonNullable<Message["tools"]> => {
  const source = Array.isArray(message?.tools)
    ? message.tools
    : Array.isArray(message?.tool_calls)
      ? message.tool_calls
      : Array.isArray(message?.toolCalls)
        ? message.toolCalls
        : [];

  return source.map((tool: any) => {
    const kind = String(tool?.tool ?? tool?.name ?? tool?.kind ?? "").trim();
    const statusRaw = String(tool?.status ?? "success").toLowerCase();
    const status = statusRaw === "running" || statusRaw === "error" ? statusRaw : "success";

    return {
      id: String(tool?.id ?? crypto.randomUUID()),
      kind: (kind || "search_relevant_models") as any,
      status,
      title: TOOL_TITLE_MAP[kind] ?? tool?.title ?? "工具执行完成",
      result: tool?.data ?? tool?.result ?? tool?.profile ?? tool?.output ?? null,
    };
  });
};

export const getMessageCopyText = (msg: Message) => {
  const parts: string[] = [];
  const textContent = msg.content?.trim();

  if (textContent) {
    parts.push(textContent);
  }

  if (Array.isArray(msg.tools) && msg.tools.length > 0) {
    const toolText = msg.tools
      .map((tool, index) => {
        const title = tool.title || tool.kind || `工具${index + 1}`;
        const resultText =
          typeof tool.result === "string"
            ? tool.result
            : JSON.stringify(tool.result ?? {}, null, 2);
        return `${title}\n${resultText}`;
      })
      .join("\n\n");
    parts.push(toolText);
  }

  return parts.join("\n\n").trim();
};