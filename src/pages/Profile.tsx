import React from "react";
import { motion } from "framer-motion";
import {
  UserRound,
  Mail,
  Briefcase,
  ChartNoAxesColumn,
  Clock3,
  Heart,
  Star,
  Sparkles,
  Database,
} from "lucide-react";
import {
  getFavoriteData,
  getFavoriteModels,
  getSimulationResults,
  toggleFavoriteData,
  type FavoriteData,
  type FavoriteModel,
  type SimulationResultItem,
} from "../lib/userCenter.ts";

type UserProfile = {
  name: string;
  email: string;
  org: string;
  role: string;
};

const USER_PROFILE_STORAGE_KEY = "geoagent_user_profile";

const getUserProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.name && parsed?.email) return parsed;
  } catch {
    // ignore
  }

  return {
    name: "黄河流域研究用户",
    email: "researcher@huanghe-lab.cn",
    org: "Yellow River Decision Lab",
    role: "Analyst",
  };
};

export default function Profile() {
  const [favoriteModels, setFavoriteModels] = React.useState<FavoriteModel[]>([]);
  const [favoriteData, setFavoriteData] = React.useState<FavoriteData[]>([]);
  const [simulationResults, setSimulationResults] = React.useState<SimulationResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [profile] = React.useState<UserProfile>(getUserProfile());

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
    refreshAll();
  }, [refreshAll]);

  const groupedSimulationResults = React.useMemo(() => {
    const grouped: Record<string, SimulationResultItem[]> = {};
    simulationResults.forEach((item) => {
      const modelName = item.fromModel || "未标记模型";
      if (!grouped[modelName]) grouped[modelName] = [];
      grouped[modelName].push(item);
    });

    return Object.entries(grouped)
      .map(([modelName, files]) => ({ modelName, files }))
      .sort((a, b) => b.files.length - a.files.length);
  }, [simulationResults]);

  const handleToggleDataFavorite = async (item: SimulationResultItem) => {
    const favorited = await toggleFavoriteData({
      name: item.name,
      source: "model-result",
      fromModel: item.fromModel,
    });
    await refreshAll();
    alert(favorited ? `已收藏数据：${item.name}` : `已取消收藏数据：${item.name}`);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#dbeafe_0,#f8fafc_45%,#eef2ff_100%)] px-4 py-6 md:px-8">
      <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-5 backdrop-blur md:p-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr]">
            <div className="flex items-start gap-4">
              <div className="relative rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 p-4 text-white shadow-lg shadow-cyan-200/70">
                <UserRound size={26} />
                <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">用户中心</h1>
                <p className="text-sm text-slate-500">收藏资源与模拟结果已升级为后端持久化，支持跨端同步查看。</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p className="inline-flex items-center gap-2"><Mail size={14} />{profile.email}</p>
                  <p className="inline-flex items-center gap-2"><Briefcase size={14} />{profile.org}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-blue-50 p-4">
              <p className="text-xs text-slate-500">当前账号</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{profile.name}</p>
              <p className="text-sm text-slate-600">角色：{profile.role}</p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                <Sparkles size={12} />
                最后活跃：{new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Heart size={16} />
              <span className="text-xs">收藏模型</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{favoriteModels.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Star size={16} />
              <span className="text-xs">收藏数据</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{favoriteData.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <ChartNoAxesColumn size={16} />
              <span className="text-xs">模拟结果文件</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{simulationResults.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Database size={16} />
              <span className="text-xs">结果模型组</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{groupedSimulationResults.length}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">收藏资源</h2>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600">
                模型 {favoriteModels.length} · 数据 {favoriteData.length}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">收藏模型</p>
                {favoriteModels.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                    暂无收藏模型。可在模型库或 AI 推荐模型区域点击“收藏模型”。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {favoriteModels.slice(0, 6).map((model) => (
                      <motion.div
                        key={model.id}
                        whileHover={{ y: -2 }}
                        className="rounded-xl border border-slate-200 bg-linear-to-r from-white to-rose-50 p-3"
                      >
                        <p className="text-sm font-semibold text-slate-800">{model.name}</p>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{model.description || "无模型说明"}</p>
                        <p className="mt-1 text-xs text-slate-400">来源：{model.source || "unknown"}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">收藏数据</p>
                {favoriteData.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                    暂无收藏数据。可在模拟结果中收藏关键输出文件。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {favoriteData.slice(0, 6).map((data) => (
                      <motion.div
                        key={data.id}
                        whileHover={{ y: -2 }}
                        className="rounded-xl border border-slate-200 bg-linear-to-r from-white to-amber-50 p-3"
                      >
                        <p className="text-sm font-semibold text-slate-800">{data.name}</p>
                        <p className="mt-1 text-xs text-slate-500">来源：{data.source || "unknown"} · 模型：{data.fromModel || "-"}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">模拟结果</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">按模型分组</span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                正在同步后端数据...
              </div>
            ) : groupedSimulationResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                暂无模拟结果。模型运行并添加结果后，会自动出现在这里。
              </div>
            ) : (
              <div className="space-y-3">
                {groupedSimulationResults.map((group) => (
                  <div key={group.modelName} className="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-blue-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{group.modelName}</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">{group.files.length} 个文件</span>
                    </div>

                    <div className="space-y-2">
                      {group.files.map((item) => {
                        const favorited = favoriteData.some((d) => d.name === item.name);
                        return (
                          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-700">{item.name}</p>
                              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock3 size={12} />
                                {item.createdAt}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleDataFavorite(item)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                                favorited
                                  ? "border-rose-300 bg-rose-50 text-rose-600"
                                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Heart size={12} className={favorited ? "fill-rose-500 text-rose-500" : "text-slate-500"} />
                              {favorited ? "已收藏" : "收藏结果"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
