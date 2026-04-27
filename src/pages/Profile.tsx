import React from "react";
import { motion } from "framer-motion";
import {
  UserRound,
  Mail,
  Clock3,
  Heart,
  Star,
  Database,
  FolderKanban,
  Pencil,
  Settings,
  Save,
  X,
  Upload,
  Eye,
  Download,
  ChevronRight,
} from "lucide-react";
import {
  getFavoriteData,
  getFavoriteModels,
  getSimulationResults,
  getUserProfile,
  saveUserProfile,
  toggleFavoriteData,
  type FavoriteData,
  type FavoriteModel,
  type SimulationResultItem,
  type UserProfile,
} from "../lib/userCenter.ts";

type TaskGroup = {
  runKey: string;
  runTime: string;
  modelName: string;
  files: SimulationResultItem[];
  status: "running" | "completed" | "failed";
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getResultRunTime = (item: SimulationResultItem) => {
  const runAt = item.meta?.runAt;
  if (typeof runAt === "string" && runAt.trim()) return runAt;
  return item.createdAt;
};

const favoriteDataKey = (item: {
  name?: string;
  fromModel?: string;
  url?: string;
  runAt?: string;
}) => `${item.name || ""}::${item.fromModel || ""}::${item.url || ""}::${item.runAt || ""}`;

const Sparkline = ({ color, points }: { color: string; points: number[] }) => {
  const width = 90;
  const height = 26;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);

  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * width;
      const y = height - ((point - min) / range) * (height - 2) - 1;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mt-2">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default function Profile() {
  const [favoriteModels, setFavoriteModels] = React.useState<FavoriteModel[]>([]);
  const [favoriteData, setFavoriteData] = React.useState<FavoriteData[]>([]);
  const [simulationResults, setSimulationResults] = React.useState<SimulationResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [profile, setProfile] = React.useState<UserProfile>(() => {
    const next = getUserProfile();
    return {
      ...next,
      name: next.name?.trim() ? next.name : "Wanhao Li",
      org: next.org?.trim() ? next.org : "Yellow River Decision Lab",
    };
  });
  const [draftProfile, setDraftProfile] = React.useState<UserProfile>(profile);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [openTaskKey, setOpenTaskKey] = React.useState<string | null>(null);

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [models, data, results] = await Promise.all([
        getFavoriteModels(),
        getFavoriteData(),
        getSimulationResults(),
      ]);
      setFavoriteModels(models);
      setFavoriteData(data);
      setSimulationResults(results);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const taskGroups = React.useMemo<TaskGroup[]>(() => {
    const grouped: Record<string, SimulationResultItem[]> = {};

    simulationResults.forEach((item) => {
      const runKey = getResultRunTime(item);
      if (!grouped[runKey]) grouped[runKey] = [];
      grouped[runKey].push(item);
    });

    return Object.entries(grouped)
      .map(([runKey, files]) => {
        const modelSet = new Set(files.map((item) => item.fromModel || "Unknown Model"));
        const statusRaw = String(files[0]?.meta?.status || "completed").toLowerCase();
        const status: TaskGroup["status"] =
          statusRaw === "running" || statusRaw === "failed" ? (statusRaw as TaskGroup["status"]) : "completed";
        return {
          runKey,
          runTime: runKey,
          modelName: modelSet.size === 1 ? [...modelSet][0] : "Multi-Model Task",
          files: [...files].sort((a, b) => a.name.localeCompare(b.name)),
          status,
        };
      })
      .sort((a, b) => new Date(b.runTime).getTime() - new Date(a.runTime).getTime());
  }, [simulationResults]);

  const latestActiveTime = taskGroups[0]?.runTime || new Date().toISOString();

  const handleToggleDataFavorite = async (item: SimulationResultItem) => {
    const runAt = getResultRunTime(item);
    const favorited = await toggleFavoriteData({
      name: item.name,
      source: "model-result",
      fromModel: item.fromModel,
      url: item.url,
      runAt,
    });
    await refreshAll();
    alert(favorited ? `已收藏数据：${item.name}` : `已取消收藏数据：${item.name}`);
  };

  const handleStartEdit = () => {
    setDraftProfile(profile);
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = () => {
    saveUserProfile(draftProfile);
    setProfile(draftProfile);
    setIsEditingProfile(false);
    alert("个人信息已更新");
  };

  const handleAvatarUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      setDraftProfile((prev) => ({ ...prev, avatar: value }));
    };
    reader.readAsDataURL(file);
  };

  const metrics = [
    {
      icon: Star,
      title: "收藏模型",
      value: favoriteModels.length,
      trend: "较上周 +1",
      line: [1, 2, 2, 3, 2, 2, favoriteModels.length || 2],
      color: "#3B82F6",
    },
    {
      icon: Database,
      title: "数据集",
      value: favoriteData.length,
      trend: favoriteData.length === 0 ? "暂无新增" : `新增 ${Math.min(favoriteData.length, 3)} 条`,
      line: [0, 0, 1, 0, 0, 0, favoriteData.length],
      color: "#06B6D4",
    },
    {
      icon: FolderKanban,
      title: "模拟结果",
      value: simulationResults.length,
      trend: `任务轮次 ${taskGroups.length}`,
      line: [1, 2, 3, 3, 4, 4, simulationResults.length || 5],
      color: "#6366F1",
    },
    {
      icon: Clock3,
      title: "最近活跃",
      value: formatDateTime(latestActiveTime).split(" ")[1] || "--:--:--",
      trend: formatDateTime(latestActiveTime).split(" ")[0] || "-",
      line: [2, 3, 2, 3, 4, 3, 4],
      color: "#0EA5E9",
    },
  ];

  const statusStyle: Record<TaskGroup["status"], string> = {
    running: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
  };

  const statusText: Record<TaskGroup["status"], string> = {
    running: "运行中",
    completed: "已完成",
    failed: "失败",
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] px-4 py-6 md:px-8"
      style={{
        backgroundColor: "#F8FAFC",
        backgroundImage:
          "linear-gradient(to right, rgba(148,163,184,0.11) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.11) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-44 overflow-hidden bg-linear-to-r from-blue-700 to-cyan-100">
            <div className="absolute inset-0 opacity-25">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.45), transparent 35%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.2), transparent 45%)",
                }}
              />
            </div>
            {Array.from({ length: 9 }).map((_, idx) => (
              <motion.span
                key={idx}
                className="absolute h-1.5 w-1.5 rounded-full bg-white/70"
                style={{
                  left: `${10 + idx * 10}%`,
                  top: `${25 + (idx % 3) * 20}%`,
                }}
                animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2 + (idx % 3), repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
            <div className="absolute -bottom-10 left-0 right-0 h-24 bg-white/30 blur-2xl" />
          </div>

          <div className="relative px-6 pb-6 pt-4">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="-mt-14 rounded-2xl border border-white/40 bg-white/35 p-2 backdrop-blur-md shadow-lg">
                  {((isEditingProfile ? draftProfile.avatar : profile.avatar) || "").trim() ? (
                    <img
                      src={isEditingProfile ? draftProfile.avatar : profile.avatar}
                      alt="avatar"
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white text-blue-600">
                      <UserRound size={34} />
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <h1 className="text-2xl font-semibold text-slate-900">{profile.name || "Wanhao Li"}</h1>
                  <p className="mt-1 text-sm text-slate-500">{profile.org || "Yellow River Decision Lab"}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Mail size={12} />
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} />
                    编辑资料
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <X size={14} />
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      <Save size={14} />
                      保存
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
                  title="设置"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {isEditingProfile && (
              <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-slate-500">姓名</p>
                  <input
                    value={draftProfile.name}
                    onChange={(e) => setDraftProfile((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">机构</p>
                  <input
                    value={draftProfile.org}
                    onChange={(e) => setDraftProfile((prev) => ({ ...prev, org: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">角色</p>
                  <input
                    value={draftProfile.role}
                    onChange={(e) => setDraftProfile((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">头像</p>
                  <div className="flex gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                      <Upload size={12} />
                      上传
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                    <input
                      value={draftProfile.avatar || ""}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, avatar: e.target.value }))}
                      placeholder="头像 URL"
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {metrics.map((item) => (
                <motion.button
                  whileHover={{ y: -2 }}
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition"
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <item.icon size={14} />
                      {item.title}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.trend}</p>
                  <Sparkline color={item.color} points={item.line} />
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_2.1fr]">
          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">收藏模型</h2>
                <span className="text-xs text-slate-500">{favoriteModels.length}</span>
              </div>
              <div className="space-y-2">
                {favoriteModels.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
                    暂无收藏模型
                  </div>
                ) : (
                  favoriteModels.slice(0, 6).map((model) => (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={model.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{model.name}</p>
                        <Heart size={13} className="fill-rose-500 text-rose-500" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{model.description || "无描述"}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">收藏数据</h2>
                <span className="text-xs text-slate-500">{favoriteData.length}</span>
              </div>
              {favoriteData.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Database size={18} className="mx-auto text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">暂无收藏数据</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteData.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="truncate text-sm font-medium text-slate-700">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.fromModel || "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">模拟任务</h2>
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                正在同步任务数据...
              </div>
            ) : taskGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                暂无模拟任务
              </div>
            ) : (
              <div className="space-y-3">
                {taskGroups.map((task) => (
                  <motion.article
                    whileHover={{ y: -2 }}
                    key={task.runKey}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{task.modelName}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 size={12} />
                          {formatDateTime(task.runTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[task.status]}`}>
                          {statusText[task.status]}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenTaskKey((prev) => (prev === task.runKey ? null : task.runKey))}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <Eye size={12} />
                          查看结果
                        </button>
                        <a
                          href={task.files[0]?.url || "#"}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          <Download size={12} />
                          下载
                        </a>
                      </div>
                    </div>

                    {openTaskKey === task.runKey && (
                      <div className="space-y-2">
                        {task.files.map((file) => {
                          const runAt = getResultRunTime(file);
                          const key = favoriteDataKey({
                            name: file.name,
                            fromModel: file.fromModel,
                            url: file.url,
                            runAt,
                          });
                          const favorited = favoriteData.some(
                            (fav) =>
                              favoriteDataKey({
                                name: fav.name,
                                fromModel: fav.fromModel,
                                url: fav.url,
                                runAt: fav.runAt,
                              }) === key,
                          );

                          return (
                            <div
                              key={file.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <p className="truncate text-sm text-slate-700">{file.name}</p>
                              <button
                                type="button"
                                onClick={() => void handleToggleDataFavorite(file)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                                  favorited
                                    ? "border-rose-300 bg-rose-50 text-rose-600"
                                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <Heart
                                  size={12}
                                  className={favorited ? "fill-rose-500 text-rose-500" : "text-slate-500"}
                                />
                                {favorited ? "已收藏" : "收藏数据"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.article>
                ))}
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}
