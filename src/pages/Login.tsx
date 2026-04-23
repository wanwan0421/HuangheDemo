import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BadgeCheck, Bot, KeyRound, Layers3, Mail, LogIn } from "lucide-react";
import { login } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | undefined)?.from || "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login({ email, password });
    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="relative h-full overflow-hidden bg-[#050816] px-4 py-4 text-slate-100 sm:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.14),transparent_24%),linear-gradient(180deg,#050816_0%,#070b18_100%)]" />
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[72px_72px]" />
      <div className="absolute left-10 top-12 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-6 right-8 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="order-1 hidden space-y-8 p-8 backdrop-blur-xl lg:block lg:p-10">
            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-semibold leading-15 text-white md:text-5xl">
                继续操控你的地理建模决策智能体
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                登录后可以进行地理建模决策支持、智能对话和资源管理
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Bot, title: "智能驱动", text: "利用AI技术提升地理建模效率" },
                { icon: BadgeCheck, title: "人机对话", text: "与智能体进行自然语言交互，获取决策支持" },
                { icon: Layers3, title: "资源共享", text: "统一管理模型、数据和模拟结果" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                  <div className="flex flex-1 items-center gap-2">
                    <item.icon className="text-blue-300" size={18} />
                  <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="order-2 w-full rounded-2xl border border-blue-400/20 bg-[#0b1223]/80 p-6 shadow-[0_24px_100px_rgba(8,15,35,0.85)] backdrop-blur-xl md:p-8 lg:justify-self-end">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-400/10 text-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.16)]">
                <LogIn size={22} />
              </div>
              <h2 className="text-2xl font-semibold text-white">欢迎回来</h2>
              <p className="mt-2 text-sm text-slate-400">登录后继续你的地理建模决策之旅</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 inline-flex items-center gap-2 text-sm text-slate-300">
                  <Mail size={14} className="text-blue-300" />
                  邮箱
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  placeholder="输入你的邮箱"
                />
              </label>

              <label className="block">
                <span className="mb-2 inline-flex items-center gap-2 text-sm text-slate-300">
                  <KeyRound size={14} className="text-blue-300" />
                  密码
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  placeholder="输入你的密码"
                />
              </label>

              {error && (
                <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(59,130,246,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(34,211,238,0.28)]"
              >
                <LogIn size={16} />
                进入系统
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              还没有账号？
              <Link to="/register" className="ml-1 font-semibold text-blue-300 transition hover:text-blue-500">
                立即注册
              </Link>
            </p>
          </section>
      </div>
      </div>
    </div>
  );
}
