import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Earth } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MapboxViewer from "./mapbox";
import { FinalProfileCard } from "./ToolTimeline";

type UploadedFileItem = {
  name: string;
  file: File;
  inputName: string;
};

type DataScanModalProps = {
  open: boolean;
  uploadedFiles: UploadedFileItem[];
  geoJsonDataForMap: Array<{ name: string; data: any }>;
  scanResults: Record<string, any>;
  selectedScanFile: string | null;
  isScanning: boolean;
  activeChatId: string | null;
  isAligning: boolean;
  alignmentResult: any | null;
  isNoGoAlignment: boolean;
  onClose: () => void;
  onSelectScanFile: (key: string) => void;
  onAlign: () => void;
  onMapping: () => void;
};

export default function DataScanModal({
  open,
  uploadedFiles,
  geoJsonDataForMap,
  scanResults,
  selectedScanFile,
  isScanning,
  activeChatId,
  isAligning,
  alignmentResult,
  isNoGoAlignment,
  onClose,
  onSelectScanFile,
  onAlign,
  onMapping,
}: DataScanModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-200"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-2xl w-8/12 h-4/5 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 bg-slate-900 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Earth size={24} className="text-white" />
                <h2 className="text-2xl font-bold text-white">
                  Data scanning results
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                {uploadedFiles.length > 0 && geoJsonDataForMap.length > 0 ? (
                  <MapboxViewer geoJsonDataArray={geoJsonDataForMap} />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <p className="text-gray-400">
                      Display the map here after uploading the file.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-[45%] flex flex-col">
                <div className="shrink-0 border-b border-gray-200">
                  {scanResults && (
                    <div className="flex overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:bg-slate-100 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                      {uploadedFiles.map((file, idx) => {
                        const fileKey = `${file.name}-${idx}`;
                        return (
                          <button
                            key={fileKey}
                            onClick={() => onSelectScanFile(fileKey)}
                            className={`text-left px-4 py-2 transition-all ${
                              selectedScanFile === fileKey
                                ? "bg-slate-400"
                                : "bg-gray-100 hover:border-gray-300"
                            }`}
                          >
                            <div
                              className={`text-xs text-gray-500 ${
                                selectedScanFile === fileKey
                                  ? "text-white"
                                  : "text-gray-700"
                              }`}
                            >
                              {file.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  {isScanning ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Scanning...</p>
                      </div>
                    </div>
                  ) : selectedScanFile && scanResults[selectedScanFile] ? (
                    <div className="space-y-4">
                      <FinalProfileCard
                        profile={
                          scanResults[selectedScanFile]?.profile ||
                          scanResults[selectedScanFile]
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Select a file to view scan results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:h-50 gap-3 border-t border-gray-200 p-4 bg-white">
              <div className="hidden md:block w-1 self-stretch rounded-full bg-gray-900" />
              <div className="flex-1 min-w-0 rounded-lg p-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:bg-slate-100 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                {alignmentResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">
                          Alignment conclusion
                        </h3>
                        {typeof alignmentResult.overall_score === "number" && (
                          <p className="text-[13px] font-semibold text-red-700">
                            (Overall Score:
                            <span className="font-semibold text-red-700">
                              {(alignmentResult.overall_score * 100).toFixed(0)}%
                            </span>
                            )
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isNoGoAlignment
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isNoGoAlignment ? "NO-GO" : "GO"}
                      </span>
                    </div>

                    {alignmentResult.summary && (
                      <div className="text-xs text-gray-600 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {alignmentResult.summary}
                        </ReactMarkdown>
                      </div>
                    )}

                    {isNoGoAlignment &&
                      Array.isArray(alignmentResult.blocking_issues) &&
                      alignmentResult.blocking_issues.length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-2">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Blocking Issues
                          </p>
                          <ul className="list-disc pl-4 space-y-1">
                            {alignmentResult.blocking_issues.map(
                              (issue: string, idx: number) => (
                                <li
                                  key={`blocking-${idx}`}
                                  className="text-xs text-red-700 leading-relaxed"
                                >
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {issue}
                                  </ReactMarkdown>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                    {!isNoGoAlignment && (
                      <p className="text-xs text-green-700">
                        Current can run now!
                      </p>
                    )}

                    {isNoGoAlignment &&
                      Array.isArray(alignmentResult.suggested_transformations) &&
                      alignmentResult.suggested_transformations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Suggested Transformations
                          </p>
                          <ul className="list-disc pl-4 space-y-1">
                            {alignmentResult.suggested_transformations.map(
                              (transformation: string, idx: number) => (
                                <li
                                  key={`transformation-${idx}`}
                                  className="text-xs text-gray-600 leading-relaxed"
                                >
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {transformation}
                                  </ReactMarkdown>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Click Align to generate alignment conclusion.
                  </p>
                )}
              </div>

              <div className="w-full shrink-0 md:w-40 flex flex-col justify-center gap-2">
                <button
                  onClick={onAlign}
                  disabled={!activeChatId || isAligning || isScanning}
                  title="对齐数据与模型要求"
                  className="w-full px-3 py-3 bg-slate-900 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-300 transition-all"
                >
                  {isAligning ? "Aligning..." : "Align"}
                </button>

                {isNoGoAlignment && (
                  <button
                    onClick={onMapping}
                    disabled={!activeChatId || isAligning || isScanning}
                    title="根据对齐结果生成映射关系"
                    className="w-full px-3 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-all"
                  >
                    Mapping
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}