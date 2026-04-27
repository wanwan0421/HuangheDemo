import React from "react";
import {
  CheckCircle,
  Loader,
  AlertCircle,
  Download,
  MapPinned,
  Package,
} from "lucide-react";
import { motion } from "framer-motion";
import MapboxViewer from "./mapbox";
import type { WorkflowState } from "../types";
import { addFavoriteData, addSimulationResult } from "../lib/userCenter.ts";

interface ModelExecuteProcessProps {
  isRunning: boolean;
  taskStatus?: string;
  result: any | null;
  error?: string | null;
  modelName?: string | null;
  workflow?: WorkflowState[];
}

type OutputRow = {
  id: string;
  model: string;
  stateName: string;
  eventName: string;
  name: string;
  url: string;
};

const isZipLike = (url: string) => /\.(zip|rar|7z|tar|gz)(\?|$)/i.test(url);
const isGeoJsonLike = (url: string) => /\.(geojson|json)(\?|$)/i.test(url);

const ModelExecuteProcess: React.FC<ModelExecuteProcessProps> = ({
  isRunning,
  taskStatus = "idle",
  result,
  error,
  modelName,
  workflow,
}) => {
  const [mapPreviewData, setMapPreviewData] = React.useState<any[]>([]);
  const [runAt, setRunAt] = React.useState<string | null>(null);
  const [runFavoritedRows, setRunFavoritedRows] = React.useState<Set<string>>(new Set());
  const autoSavedRef = React.useRef<Set<string>>(new Set());

  const outputs = React.useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result?.result)) return result.result;
    if (Array.isArray(result?.outputs)) return result.outputs;
    return [];
  }, [result]);

  const workflowNames = React.useMemo(() => {
    const names: string[] = [];
    (workflow || []).forEach((state) => {
      state.events.forEach((event) => {
        names.push(`${state.stateName}-${event.eventName}`);
      });
    });
    return names;
  }, [workflow]);

  const getDisplayName = React.useCallback(
    (output: any, idx: number) => {
      if (output?.name) return output.name;
      return workflowNames[idx] || `Output-${idx + 1}`;
    },
    [workflowNames],
  );

  const downloadableOutputs = React.useMemo(() => {
    return outputs.filter((item: any) => typeof item?.url === "string" && item.url.length > 0);
  }, [outputs]);

  const zipOutputs = React.useMemo(() => {
    return downloadableOutputs.filter((item: any) => isZipLike(item.url));
  }, [downloadableOutputs]);

  const previewCandidates = React.useMemo(() => {
    return downloadableOutputs.filter(
      (item: any) =>
        isGeoJsonLike(item.url) || item?.geojson || item?.conversion?.data,
    );
  }, [downloadableOutputs]);

  React.useEffect(() => {
    let cancelled = false;

    const loadPreviewData = async () => {
      const collected: any[] = [];

      for (let i = 0; i < previewCandidates.length; i += 1) {
        const item = previewCandidates[i];
        const name = getDisplayName(item, i);

        if (item?.conversion?.data) {
          collected.push({
            name,
            data: {
              conversion: {
                type: "vector",
                data: item.conversion.data,
              },
            },
          });
          continue;
        }

        if (item?.geojson) {
          collected.push({
            name,
            data: {
              conversion: {
                type: "vector",
                data: item.geojson,
              },
            },
          });
          continue;
        }

        if (item?.url && isGeoJsonLike(item.url)) {
          try {
            const res = await fetch(item.url);
            const json = await res.json();
            collected.push({
              name,
              data: {
                conversion: {
                  type: "vector",
                  data: json,
                },
              },
            });
          } catch (fetchError) {
            console.warn("Failed to load geojson preview", item.url, fetchError);
          }
        }
      }

      if (!cancelled) setMapPreviewData(collected);
    };

    if (previewCandidates.length > 0) {
      void loadPreviewData();
    } else {
      setMapPreviewData([]);
    }

    return () => {
      cancelled = true;
    };
  }, [previewCandidates, getDisplayName]);

  const workflowMatrix = React.useMemo(() => {
    const rows: Array<{ stateName: string; eventName: string; inputName: string }> = [];
    (workflow || []).forEach((state) => {
      state.events.forEach((event) => {
        event.inputs.forEach((input) => {
          rows.push({
            stateName: state.stateName,
            eventName: event.eventName,
            inputName: input.name,
          });
        });
      });
    });
    return rows;
  }, [workflow]);

  const outputRows = React.useMemo<OutputRow[]>(() => {
    return downloadableOutputs.map((item: any, idx: number) => {
      const wf = workflowMatrix[idx] || {
        stateName: "Result",
        eventName: "Output",
        inputName: "",
      };
      const displayName = getDisplayName(item, idx);
      return {
        id: `${displayName}-${idx}`,
        model: modelName || "Model",
        stateName: wf.stateName,
        eventName: wf.eventName,
        name: displayName,
        url: item.url,
      };
    });
  }, [downloadableOutputs, workflowMatrix, getDisplayName, modelName]);

  React.useEffect(() => {
    if (!result) {
      setRunAt(null);
      setRunFavoritedRows(new Set());
      autoSavedRef.current.clear();
      return;
    }

    setRunAt(new Date().toISOString());
    setRunFavoritedRows(new Set());
    autoSavedRef.current.clear();
  }, [result]);

  React.useEffect(() => {
    if (!result || outputRows.length === 0 || !runAt) return;

    outputRows.forEach((row) => {
      const saveKey = `${runAt}|${row.model}|${row.name}|${row.url}`;
      if (autoSavedRef.current.has(saveKey)) return;
      autoSavedRef.current.add(saveKey);

      addSimulationResult({
        name: row.name,
        fromModel: row.model,
        url: row.url,
        meta: {
          stateName: row.stateName,
          eventName: row.eventName,
          url: row.url,
          runAt,
        },
      }).catch((saveError) => {
        console.warn("Auto add simulation result failed", saveError);
      });
    });
  }, [result, outputRows, runAt]);

  const groupedOutputRows = React.useMemo(() => {
    const groups: Array<{ stateName: string; rows: OutputRow[] }> = [];
    outputRows.forEach((row) => {
      const stateName = row.stateName || "Result";
      const existing = groups.find((group) => group.stateName === stateName);
      if (existing) existing.rows.push(row);
      else groups.push({ stateName, rows: [row] });
    });
    return groups;
  }, [outputRows]);

  const getRowRunKey = (row: OutputRow) => {
    return `${runAt || "no-run"}|${row.model}|${row.name}|${row.url}`;
  };

  const handleAddToFavoriteData = async (row: OutputRow) => {
    try {
      await addFavoriteData({
        name: row.name,
        source: "model-result",
        fromModel: row.model,
        url: row.url,
        runAt: runAt || undefined,
      });
      const rowRunKey = getRowRunKey(row);
      setRunFavoritedRows((prev) => {
        const next = new Set(prev);
        next.add(rowRunKey);
        return next;
      });
      alert(`已添加到收藏数据：${row.name}`);
    } catch (addError) {
      console.error("Add favorite data failed", addError);
      alert("操作失败，请稍后重试");
    }
  };

  if (isRunning || taskStatus === "running") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader size={22} className="text-blue-600" />
          </motion.div>
          <div>
            <p className="text-base font-semibold text-blue-700">Model task is running</p>
            <p className="text-sm text-blue-600">
              The task has been published. Waiting for result...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (taskStatus === "failed" || error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-base font-semibold text-red-700">Model run failed</p>
        </div>
        <p className="whitespace-pre-wrap text-sm text-red-700">
          {error || "Model task failed. Please check task input or backend logs and retry."}
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <p className="truncate text-sm font-semibold text-gray-800 md:text-base">
              {modelName || "Model"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">计算成功</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {groupedOutputRows.length > 0 ? (
            groupedOutputRows.map((group) => (
              <div key={group.stateName} className="border-b last:border-b-0">
                <div className="bg-slate-100/80 px-3 py-2 text-sm font-semibold text-slate-700">
                  {group.stateName}
                </div>
                {group.rows.map((row) => {
                  const rowRunKey = getRowRunKey(row);
                  const favorited = runFavoritedRows.has(rowRunKey);
                  return (
                    <div key={row.id} className="grid grid-cols-5 items-center border-t text-sm">
                      <div className="col-span-2 truncate px-3 py-2 text-gray-600">{row.eventName}</div>
                      <div className="col-span-3 px-3 py-2">
                        <div className="flex items-center justify-start gap-2 md:justify-end">
                          <a
                            href={row.url}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 text-xs text-white"
                          >
                            <Download size={12} />
                            下载文件
                          </a>
                          <button
                            type="button"
                            onClick={() => void handleAddToFavoriteData(row)}
                            className={`rounded-full px-2 py-1 text-xs text-white ${
                              favorited ? "bg-rose-500 hover:bg-rose-600" : "bg-cyan-500 hover:bg-cyan-600"
                            }`}
                          >
                            {favorited ? "已收藏数据" : "添加到收藏数据"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="px-3 py-5 text-sm text-gray-500">暂无可下载输出。</div>
          )}
        </div>

        {mapPreviewData.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
            <div className="flex items-center gap-2 border-b bg-white px-3 py-2 text-sm font-semibold text-gray-700">
              <MapPinned size={16} className="text-blue-600" />
              结果地图预览（可直接解析的数据）
            </div>
            <div style={{ height: "300px" }}>
              <MapboxViewer geoJsonDataArray={mapPreviewData} />
            </div>
          </div>
        )}

        {zipOutputs.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Package size={14} />
            检测到压缩包结果，压缩包内容暂不支持直接地图预览，请先下载并解压查看。
          </div>
        )}

        {downloadableOutputs.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs text-gray-500">Raw Result:</p>
            <pre className="max-h-[200px] overflow-auto text-xs text-gray-700 wrap-break-word">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
      <p className="text-sm text-gray-500">No running task yet.</p>
    </div>
  );
};

export default ModelExecuteProcess;
