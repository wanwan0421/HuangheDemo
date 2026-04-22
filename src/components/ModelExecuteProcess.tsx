import React from "react";
import { CheckCircle, Loader, AlertCircle, Download, MapPinned, Package } from "lucide-react";
import { motion } from "framer-motion";
import MapboxViewer from "./mapbox";
import type { WorkflowState } from "../types";
import { addSimulationResult } from "../lib/userCenter.ts";

interface ModelExecuteProcessProps {
    isRunning: boolean;
    taskStatus?: string;
    result: any | null;
    error?: string | null;
    modelName?: string | null;
    workflow?: WorkflowState[];
}

const ModelExecuteProcess: React.FC<ModelExecuteProcessProps> = ({
    isRunning,
    taskStatus = "idle",
    result,
    error,
    modelName,
    workflow,
}) => {
    const [mapPreviewData, setMapPreviewData] = React.useState<any[]>([]);

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
            const flowName = workflowNames[idx] || `Output-${idx + 1}`;
            return flowName;
        },
        [workflowNames],
    );

    const isZipLike = (url: string) => /\.(zip|rar|7z|tar|gz)(\?|$)/i.test(url);
    const isGeoJsonLike = (url: string) => /\.(geojson|json)(\?|$)/i.test(url);

    const downloadableOutputs = React.useMemo(() => {
        return outputs.filter((o: any) => typeof o?.url === "string" && o.url.length > 0);
    }, [outputs]);

    const zipOutputs = React.useMemo(() => {
        return downloadableOutputs.filter((o: any) => isZipLike(o.url));
    }, [downloadableOutputs]);

    const previewCandidates = React.useMemo(() => {
        return downloadableOutputs.filter((o: any) => isGeoJsonLike(o.url) || o?.geojson || o?.conversion?.data);
    }, [downloadableOutputs]);

    React.useEffect(() => {
        let cancelled = false;

        const loadPreviewData = async () => {
            const collected: any[] = [];

            for (let i = 0; i < previewCandidates.length; i++) {
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
                    } catch (e) {
                        console.warn("Failed to load geojson preview", item.url, e);
                    }
                }
            }

            if (!cancelled) {
                setMapPreviewData(collected);
            }
        };

        if (previewCandidates.length > 0) {
            loadPreviewData();
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

    const previewNameSet = React.useMemo(() => {
        return new Set(mapPreviewData.map((item) => item.name));
    }, [mapPreviewData]);

    const outputRows = React.useMemo(() => {
        return downloadableOutputs.map((item: any, idx: number) => {
            const wf = workflowMatrix[idx] || { stateName: "Result", eventName: "Output", inputName: "" };
            const displayName = getDisplayName(item, idx);
            return {
                id: `${displayName}-${idx}`,
                model: modelName || "Model",
                stateName: wf.stateName,
                eventName: wf.eventName,
                name: displayName,
                url: item.url,
                isZip: isZipLike(item.url),
                canPreview: previewNameSet.has(displayName),
            };
        });
    }, [downloadableOutputs, workflowMatrix, getDisplayName, modelName, previewNameSet]);

    const groupedOutputRows = React.useMemo(() => {
        const groups: Array<{ stateName: string; rows: any[] }> = [];
        outputRows.forEach((row: any) => {
            const stateName = row.stateName || "Result";
            const existing = groups.find((g) => g.stateName === stateName);
            if (existing) {
                existing.rows.push(row);
            } else {
                groups.push({ stateName, rows: [row] });
            }
        });
        return groups;
    }, [outputRows]);

    const addResultToDataCenter = async (row: any) => {
        try {
            await addSimulationResult({
                name: row.name,
                fromModel: row.model,
                url: row.url,
                meta: {
                    stateName: row.stateName,
                    eventName: row.eventName,
                    url: row.url,
                },
            });
            alert(`已添加到我的数据：${row.name}`);
        } catch (e) {
            console.error("Add to data center failed", e);
            alert("添加失败，请稍后重试");
        }
    };

    const activeMapData = mapPreviewData;

    // 运行中状态
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
                        <p className="text-sm text-blue-600">The task has been published. Waiting for result...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 失败状态（包含没有error文本的兜底情况）
    if (taskStatus === "failed" || error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <p className="text-base font-semibold text-red-700">Model run failed</p>
                </div>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                    {error || "Model task failed. Please check task input or backend logs and retry."}
                </p>
            </div>
        );
    }

    // 完成状态，展示结果
    if (result) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-sm md:text-base font-semibold text-gray-800 truncate">
                            {modelName || "Model"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={18} />
                        <span className="text-sm font-semibold">计算成功</span>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    {groupedOutputRows.length > 0 ? (
                        groupedOutputRows.map((group) => (
                            <div key={group.stateName} className="border-b last:border-b-0">
                                <div className="px-3 py-2 bg-slate-100/80 text-sm font-semibold text-slate-700">
                                    {group.stateName}
                                </div>

                                {group.rows.map((row: any) => (
                                    <div key={row.id} className="grid grid-cols-5 items-center border-t text-sm">
                                        <div className="col-span-2 px-3 py-2 text-gray-600 truncate">{row.eventName}</div>
                                        <div className="col-span-3 px-3 py-2">
                                            <div className="flex items-center gap-2 justify-start md:justify-end">
                                                <a
                                                    href={row.url}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500 text-white"
                                                >
                                                    <Download size={12} />
                                                    下载文件
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => addResultToDataCenter(row)}
                                                    className="px-2 py-1 rounded-full text-xs bg-cyan-500 text-white"
                                                >
                                                    将结果添加到我的数据
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-5 text-sm text-gray-500">暂无可下载输出。</div>
                    )}
                </div>

                {/* 地图展示：仅预览可直接解析的数据；压缩包不可直接预览 */}
                {activeMapData.length > 0 && (
                    <div className="rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                        <div className="px-3 py-2 border-b bg-white flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <MapPinned size={16} className="text-blue-600" />
                            结果地图预览（可直接解析的数据）
                        </div>
                        <div style={{ height: "300px" }}>
                            <MapboxViewer geoJsonDataArray={activeMapData} />
                        </div>
                    </div>
                )}

                {zipOutputs.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                        <Package size={14} />
                        检测到压缩包结果，压缩包内容暂不支持直接地图预览，请先下载后解压查看。
                    </div>
                )}

                {/* 原始数据展示（可选） */}
                {(downloadableOutputs.length === 0) && (
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-xs text-gray-500 mb-2">Raw Result:</p>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-[200px] wrap-break-word">
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