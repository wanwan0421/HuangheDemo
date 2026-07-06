import SimulationResources from "../assets/Simulation_resources.png";
import IndexSystem from "../assets/Index_system.png";
import IntelligentDecision from "../assets/Intelligent_decision.png";

export default function About() {
  return (
    <div className="bg-black">
      <section className="relative isolate min-h-[calc(100vh-124px)] overflow-hidden bg-[#0f1729] shadow-2xl">
        <svg
          viewBox="0 0 1024 1024"
          aria-hidden="true"
          className="absolute -left-32 top-16 -z-10 size-[34rem] opacity-80 blur-3xl"
        >
          <circle r={512} cx={512} cy={512} fill="url(#about-gradient-left)" fillOpacity="0.9" />
          <defs>
            <radialGradient id="about-gradient-left">
              <stop stopColor="#6477ff" />
              <stop offset={1} stopColor="#0f1729" />
            </radialGradient>
          </defs>
        </svg>
        <svg
          viewBox="0 0 1024 1024"
          aria-hidden="true"
          className="absolute bottom-[-12rem] right-[-10rem] -z-10 size-[36rem] opacity-70 blur-3xl"
        >
          <circle r={512} cx={512} cy={512} fill="url(#about-gradient-right)" fillOpacity="0.85" />
          <defs>
            <radialGradient id="about-gradient-right">
              <stop stopColor="#8b5cf6" />
              <stop offset={1} stopColor="#0f1729" />
            </radialGradient>
          </defs>
        </svg>

        <div className="mx-auto grid min-h-[calc(100vh-124px)] max-w-[1800px] grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-16 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              GeoAgent Platform
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl xl:text-6xl">
              关于 GeoAgent
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-9 text-slate-200 sm:text-xl">
              GeoAgent 是一个面向地理研究的智能多智能体执行框架，通过统一资源组织、
              自动化任务协同与自适应流程执行，打通黄河流域模型、数据与工具之间的高效连接。
            </p>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              平台围绕模拟资源整合、可视化分析和智能决策推演构建完整链路，
              支撑从研究问题提出到方案生成与结果表达的全过程协同。
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
              >
                返回首页
              </a>
              <a
                href="/resources"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                查看资源
              </a>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">4500+</div>
                <div className="mt-2 text-sm text-slate-300">模型资源</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">20000+</div>
                <div className="mt-2 text-sm text-slate-300">数据资源</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="mt-2 text-sm text-slate-300">核心能力板块</div>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[560px] items-center justify-center lg:min-h-[720px]">
            <div className="absolute right-0 top-6 w-[72%] rounded-[24px] border border-white/10 bg-slate-900/80 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
              <img
                alt="模拟资源页面预览"
                src={SimulationResources}
                className="w-full rounded-[18px] object-cover"
              />
            </div>

            <div className="absolute left-4 top-44 z-10 w-[58%] rounded-[24px] border border-white/10 bg-slate-900/85 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur">
              <img
                alt="可视化页面预览"
                src={IndexSystem}
                className="w-full rounded-[18px] object-cover"
              />
            </div>

            <div className="absolute bottom-0 right-10 z-20 w-[64%] rounded-[24px] border border-cyan-300/20 bg-slate-900/90 p-3 shadow-[0_30px_90px_rgba(23,37,84,0.55)] backdrop-blur">
              <img
                alt="智能决策页面预览"
                src={IntelligentDecision}
                className="w-full rounded-[18px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
