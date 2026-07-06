import React, { useState, useEffect } from 'react';
import huanghe1 from '../assets/huanghe1.jpg';
import huanghe2 from '../assets/huanghe2.jpg';
import huanghe3 from '../assets/huanghe3.jpg';
import Simulation_resources from '../assets/Simulation_resources.png';
import Index_system from '../assets/Index_system.png';
import Intelligent_decision from '../assets/Intelligent_decision.png';
import { useOutletContext } from 'react-router-dom';
import AnimatedContent from '../components/AnimatedContent';

const carouselImages = [huanghe1, huanghe2, huanghe3];
const logos = [
    { src: "src/assets/NSCCZZ.png", url: "http://nscc.zzu.edu.cn/" },
    { src: "src/assets/NNU.png", url: "https://www.njnu.edu.cn/" },
];

interface TailwindCarouselProps {
    images: string[];
}
interface OutletContextType {
    darkMode: boolean;
}

const resourceStats = [
    { id: 1, name: '模拟资源', value: '4500+ 套模型；20000+ 套数据', role: '实现多源异构资源的高效共享与复用。' },
    { id: 2, name: '多源监测可视化', value: '融合多源地理环境数据，支持多图层联动展示、空间查询与区域综合分析。' },
    { id: 3, name: '智能决策', value: '多智能体；数据映射；任务调度', role: '实现地理问题的智能方案生成与任务调度。' },
];

{/* Home Carousel Images Container Component*/ }
const TailwindCarousel: React.FC<TailwindCarouselProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto play logic
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // per 5 second

        return () => clearInterval(intervalId);
    }, [images.length]);

    // Switch to a specific index
    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="relative w-full flex flex-1 overflow-hidden">

            <div className="absolute top-2/5 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 max-w-8xl w-full mx-auto text-center z-20">
                <h1 className={'mt-4 font-sans font-extrabold tracking-tight text-center text-[64px] text-white text-shadow-lg'}>
                    GeoAgent：智能多智能体执行框架
                </h1>
                <p className={'mt-4 text-white text-shadow-lg leading-relaxed text-xl font-bold'}>
                    一个由多智能体协同驱动的自主模拟平台，通过智能化数据与模型适配打通异构资源之间的连接。
                </p>
                <p className={'text-white text-shadow-lg leading-relaxed text-xl font-bold'}>
                    以自然语言驱动任务规划、自动化资源编排和全过程管理，赋能地理研究全流程。
                </p>
            </div>

            {/* Carousel Images Container */}
            <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((src, index) => (
                    <div key={index} className="w-full shrink-0" style={{ height: 700 }}>
                        <img
                            src={src}
                            alt={`carousel-${index}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Bottom Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-5' : 'bg-gray-400 hover:bg-white/80'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default function Home() {
    const { darkMode } = useOutletContext<OutletContextType>();
    const textColor = darkMode ? "text-white" : "text-black";
    return (
        <div>
            {/* Carousel Images */}
            <TailwindCarousel images={carouselImages} />

            <div className="mt-10 text-center max-w-7xl mx-auto px-4">
                <h1 className={`font-light tracking-tight text-center text-[40px] ${textColor}`}>
                    从资源到决策再到方案，全面智能贯通
                </h1>
                <div className="h-px w-[180px] mx-auto my-4 bg-linear-to-r from-transparent via-white to-transparent"></div>
                <p className={`font-light mt-4 ${textColor} leading-relaxed text-lg`}>
                    面向多源异构资源复用、地理模拟问题感知分析与模拟方案智能调用，构建一体化研究支撑能力。
                </p>
            </div>

            <div className="mx-auto max-w-9xl px-6 py-30 lg:px-8">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                    {resourceStats.map((stat) => (
                        <div key={stat.id} className="w-full p-4 rounded-xl relative overflow-hidden bg-linear-to-b from-red-400/20 via-transparent to-transparent backdrop-blur-md border-t border-x border-white/20">
                            {/* <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-900 to-transparent" /> */}
                            <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-900 to-transparent" />
                            <div className="relative flex flex-col justify-between items-center gap-y-2">
                                <dd className={`order-first text-2xl font-sans tracking-tight ${textColor} sm:text-3xl`}>
                                    {stat.name}
                                </dd>
                                <dt className={`text-base/7 font-light ${textColor}`}>{stat.value}</dt>
                                <p className={`text-base font-light ${textColor}`}>{stat.role}</p>
                            </div>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="mt-10 text-center max-w-7xl mx-auto px-4">
                <h1 className={`font-light tracking-tight text-center text-[40px] ${textColor}`}>
                    {`${resourceStats[0].name}`}
                </h1>
                <div className="h-px w-[180px] mx-auto my-4 bg-linear-to-r from-transparent via-white to-transparent"></div>
            </div>

            <AnimatedContent
                distance={150}
                direction="vertical"
                reverse={false}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1}
                threshold={0.1}
                delay={0}
            >
                <div className="mx-auto max-w-7xl py-10 sm:px-6 sm:py-16 lg:px-8">
                    <div className="relative isolate overflow-hidden h-150 bg-gray-900 px-6 py-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
                        <svg
                            viewBox="0 0 1024 1024"
                            aria-hidden="true"
                            className="absolute top-1/2 left-1/4 -z-10 size-256 -translate-y-3/4 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/4 lg:ml-0 lg:-translate-x-3/4 lg:-translate-y-3/4"
                        >
                            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
                            <defs>
                                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                                    <stop stopColor="#7775D6" />
                                    <stop offset={1} stopColor="#4169E1" />
                                </radialGradient>
                            </defs>
                        </svg>
                        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-30 lg:text-left">
                            <h2 className="text-3xl font-bold text-sans text-balance text-white sm:text-4xl">
                                多源资源汇聚
                            </h2>
                            <p className="mt-6 text-lg/8 text-sans text-gray-200 leading-6">
                                聚焦黄河流域多样化、异构化模拟资源的整合，
                                通过服务化封装、跨平台部署和统一数据模型构建，推进资源协同集成。
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                                <a
                                    href="/resources"
                                    className="rounded-md bg-white px-3.5 py-2.5 text-sm text-sans text-black font-bold shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    {' '}
                                    立即进入{' '}
                                </a>
                            </div>
                        </div>
                        <div className="relative mt-16 h-80 lg:mt-8">
                            <img
                                alt="App screenshot"
                                src={Simulation_resources}
                                className="absolute top-0 left-0 h-130 max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
                            />
                        </div>
                    </div>
                </div>
            </AnimatedContent>

            <div className="mt-10 text-center max-w-7xl mx-auto px-4">
                <h1 className={`font-light tracking-tight text-center text-[40px] ${textColor}`}>
                    {`${resourceStats[1].name}`}
                </h1>
                <div className="h-px w-[180px] mx-auto my-4 bg-linear-to-r from-transparent via-white to-transparent"></div>
            </div>

            {/* Index System CAT */}
            <AnimatedContent
                distance={150}
                direction="vertical"
                reverse={false}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1}
                threshold={0.1}
                delay={0}
            >
                <div className="mx-auto max-w-7xl py-10 sm:px-6 sm:py-16 lg:px-8">
                    <div className="relative isolate overflow-hidden h-150 bg-gray-900 px-6 py-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
                        <svg
                            viewBox="0 0 1024 1024"
                            aria-hidden="true"
                            className="absolute top-1/2 left-1/4 -z-10 size-256 -translate-y-3/4 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/4 lg:ml-0 lg:-translate-x-3/4 lg:-translate-y-3/4"
                        >
                            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
                            <defs>
                                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                                    <stop stopColor="#7775D6" />
                                    <stop offset={1} stopColor="#4169E1" />
                                </radialGradient>
                            </defs>
                        </svg>
                        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-30 lg:text-left">
                            <h2 className="text-3xl font-bold text-sans text-balance text-white sm:text-4xl">
                                多源数据融合展示
                            </h2>
                            <p className="mt-6 text-lg/8 text-sans text-gray-200 leading-6">
                                融合多源地理环境数据，支持地图联动、图层切换、空间查询与区域综合分析，为环境监测和地理建模结果展示提供直观支撑。
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                                <a
                                    href="/monitoring"
                                    className="rounded-md bg-white px-3.5 py-2.5 text-sm text-sans text-black font-bold shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    立即进入
                                </a>
                            </div>
                        </div>
                        <div className="relative mt-16 h-80 lg:mt-8">
                            <img
                                alt="App screenshot"
                                src={Index_system}
                                className="absolute top-0 left-0 h-130 max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
                            />
                        </div>
                    </div>
                </div>
            </AnimatedContent>

            <div className="mt-10 text-center max-w-7xl mx-auto px-4">
                <h1 className={`font-light tracking-tight text-center text-[40px] ${textColor}`}>
                    {`${resourceStats[2].name}`}
                </h1>
                <div className="h-px w-[180px] mx-auto my-4 bg-linear-to-r from-transparent via-white to-transparent"></div>
            </div>

            <AnimatedContent
                distance={150}
                direction="vertical"
                reverse={false}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1}
                threshold={0.1}
                delay={0}
            >
                {/* Intelligent decision-making CAT */}
                <div className="mx-auto max-w-7xl py-10 sm:px-6 sm:py-16 lg:px-8">
                    <div className="relative isolate overflow-hidden h-150 bg-gray-900 px-6 py-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
                        <svg
                            viewBox="0 0 1024 1024"
                            aria-hidden="true"
                            className="absolute top-1/2 left-1/4 -z-10 size-256 -translate-y-3/4 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/4 lg:ml-0 lg:-translate-x-3/4 lg:-translate-y-3/4"
                        >
                            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
                            <defs>
                                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                                    <stop stopColor="#7775D6" />
                                    <stop offset={1} stopColor="#4169E1" />
                                </radialGradient>
                            </defs>
                        </svg>
                        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-30 lg:text-left">
                            <h2 className="text-3xl font-bold text-sans text-balance text-white sm:text-4xl">
                                多智能体智能模拟流程
                            </h2>
                            <p className="mt-6 text-lg/8 text-sans text-gray-200 leading-6">
                                基于标准化资源与多智能体耦合技术，实现多模型协同决策，
                                支撑地理模拟问题的自动化流程构建与智能求解。
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                                <a
                                    href="/simulation"
                                    className="rounded-md bg-white px-3.5 py-2.5 text-sm text-sans text-black font-bold shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    {' '}
                                    立即进入{' '}
                                </a>
                            </div>
                        </div>
                        <div className="relative mt-16 h-80 lg:mt-8">
                            <img
                                alt="App screenshot"
                                src={Intelligent_decision}
                                className="absolute top-0 left-0 h-130 max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
                            />
                        </div>
                    </div>
                </div>
            </AnimatedContent>

            <div className="text-center max-w-7xl mx-auto px-4 py-16 sm:py-20">
                <h1 className={`font-light tracking-tight text-center text-[40px] ${textColor}`}>
                    合作伙伴
                </h1>
                <div className="h-px w-[180px] mx-auto my-4 bg-linear-to-r from-transparent via-white to-transparent"></div>
                <div className="flex flex-wrap justify-center gap-8 mt-10">
                    {logos.map((logo, i) => (
                        <a
                            key={i}
                            href={logo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-20 w-80 flex items-center justify-center cursor-pointer"
                        >
                            <img
                                src={logo.src}
                                className="max-h-full max-w-full object-contain transition duration-300 hover:scale-[1.05] hover:opacity-100 opacity-80"
                            />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
