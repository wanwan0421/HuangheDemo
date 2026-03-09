# GeoAgent: Intelligent Multi-Agent Execution Framework

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC.svg)](https://tailwindcss.com/)
[![Mapbox GL](https://img.shields.io/badge/Mapbox_GL-3.19-4264FB.svg)](https://www.mapbox.com/)

> 基于多智能体协作的自主化地理模拟平台，通过智能数据-模型适配打通异构资源壁垒，实现自然语言驱动的任务规划、资源编排与闭环自愈。

---

## 📋 目录

- [项目简介](#-项目简介)
- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [功能模块详解](#-功能模块详解)
- [环境配置](#-环境配置)
- [API 文档](#-api-文档)
- [开发指南](#-开发指南)
- [部署说明](#-部署说明)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🎯 项目简介

**GeoAgent** 是一个面向地理问题研究的智能多智能体执行框架，旨在通过 AI 技术打通地理科学领域的资源孤岛，实现模型、数据、工具的智能化协同。

### 核心价值

- 🤖 **智能规划**：基于自然语言理解用户需求，自动分解任务并推荐合适的模型资源
- 🔗 **资源编排**：自动完成异构数据格式转换，智能匹配模型输入输出要求
- 🗺️ **可视化分析**：支持矢量和栅格地理数据的地图可视化展示
- 🔄 **闭环执行**：端到端的任务执行流程，支持自动化工作流编排
- 📊 **资源管理**：4500+ 模型资源和 20000+ 数据集的统一检索与管理

### 应用场景

- 流域水文模拟与预测
- 地理空间数据分析
- 环境变化模拟
- 资源优化配置
- 决策支持系统

---

## ✨ 核心功能

### 1. 🏠 智能首页

- 📸 **轮播展示**：动态展示黄河流域高清影像
- 📈 **数据统计**：实时展示平台资源统计和功能介绍
- 🎨 **响应式设计**：支持暗黑/明亮主题切换
- 🔥 **动画效果**：基于 Framer Motion 的流畅过渡动画

### 2. 💬 智能决策系统

#### 2.1 AI 对话助手
- 🧠 **自然语言交互**：理解用户需求并提供智能建议
- 📝 **Markdown 渲染**：支持富文本消息格式化显示
- 🔄 **流式响应**：实时展示 AI 思考和回复过程
- 💾 **会话管理**：支持多对话创建、切换、删除和历史回溯

#### 2.2 数据处理与可视化
- 📤 **文件上传**：支持多种地理数据格式
  - 矢量数据：Shapefile、GeoJSON、KML
  - 栅格数据：GeoTIFF、TIF
  - 表格数据：CSV、Excel
- 🗺️ **Mapbox 地图集成**
  - 实时展示上传的地理数据
  - 支持多图层叠加显示
  - 矢量数据（点、线、面）自动样式化
  - 栅格数据转换和渲染
  - 交互式图例和数据查询
- 🔍 **数据扫描**：自动分析文件格式、坐标系、要素数等元数据
- 📊 **结果展示**：可视化数据扫描结果和统计信息

#### 2.3 模型推荐与执行
- 🎯 **智能推荐**：基于需求自动匹配最适合的模型
- 📋 **任务卡片**：结构化展示任务需求和约束条件
- ⚙️ **工作流编排**：可视化展示模型执行工作流
- 🔄 **实时监控**：追踪模型执行状态和进度
- 📈 **结果分析**：集成化展示模型运行结果

#### 2.4 工具调用链
支持以下智能工具：
- 🔍 **search_relevant_indices**：指标库检索
- 🗂️ **search_relevant_models**：模型库检索
- ⭐ **search_most_model**：最优模型推荐
- 📄 **get_model_details**：模型详情读取
- 📁 **tool_prepare_file**：文件准备
- 🔬 **tool_detect_format**：格式检测
- 🌍 **tool_analyze_raster**：栅格数据分析
- 🗺️ **tool_analyze_vector**：矢量数据分析
- 📊 **tool_analyze_table**：表格数据分析
- ⏱️ **tool_analyze_timeseries**：时序数据分析

### 3. 📚 资源管理系统

#### 3.1 资源检索
- 🗂️ **四级分类菜单**：模型/数据 → 领域 → 主题 → 子主题
- 🔍 **关键字搜索**：支持模糊匹配和多条件筛选
- 📊 **丰富资源库**
  - 4500+ 套模型资源
  - 20000+ 套数据集
  - 完整的元数据信息（作者、时间、关键词）

#### 3.2 资源详情
- 📝 **详细描述**：资源用途、适用场景、使用说明
- 🏷️ **标签系统**：关键词标注和分类
- 👤 **作者信息**：资源贡献者和联系方式
- 📅 **版本管理**：创建时间和更新记录

### 4. 📊 指标体系

- 🎯 **25 个一级指标**：覆盖水文、气象、地形等多个维度
- 📈 **100 个二级指标**：精细化的量化评估体系
- 🔗 **智能关联**：自动识别和匹配数据与模型的指标需求

### 5. 🎨 用户体验

- 🌓 **主题切换**：支持暗黑/明亮模式
- 📱 **响应式布局**：适配桌面端和移动端
- ⚡ **流畅动画**：Framer Motion 驱动的交互动效
- 🎯 **无障碍访问**：符合 WCAG 标准的可访问性设计

---

## 🛠️ 技术栈

### 前端核心

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19.2.0 | 前端框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Vite** | 5.x | 构建工具 |
| **React Router** | 7.9.6 | 路由管理 |

### UI 框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 4.1.17 | CSS 框架 |
| **Ant Design** | 6.0.0 | 组件库 |
| **Framer Motion** | 12.23.25 | 动画库 |
| **Lucide React** | 0.554.0 | 图标库 |

### 地图可视化

| 技术 | 版本 | 用途 |
|------|------|------|
| **Mapbox GL JS** | 3.19.1 | 地图渲染引擎 |
| **GeoTIFF** | 3.0.4 | 栅格数据解析 |

### 内容渲染

| 技术 | 版本 | 用途 |
|------|------|------|
| **React Markdown** | 10.1.0 | Markdown 渲染 |
| **remark-gfm** | 4.0.1 | GitHub 风格扩展 |

### 工具库

| 技术 | 版本 | 用途 |
|------|------|------|
| **Axios** | 1.13.2 | HTTP 客户端 |
| **GSAP** | 3.13.0 | 高级动画 |
| **clsx** | 2.1.1 | 类名合并 |

---

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0
- **Mapbox Token**: 从 [Mapbox](https://www.mapbox.com/) 获取

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-org/huanghe-demo.git
cd huanghe-demo

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# 打开浏览器访问 http://localhost:5173
```

### 环境变量配置

创建 `.env` 文件：

```env
# 后端 API 地址
VITE_BACK_URL=http://localhost:3000

# Mapbox 访问令牌
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 📁 项目结构

```
huanghe-demo/
├── src/
│   ├── assets/              # 静态资源
│   │   ├── huanghe1.jpg    # 黄河图片1
│   │   ├── huanghe2.jpg    # 黄河图片2
│   │   └── ...
│   ├── components/          # 可复用组件
│   │   ├── AnimatedContent.tsx       # 动画内容包装器
│   │   ├── ChatInput.tsx             # 聊天输入框
│   │   ├── ConfigurationSidebar.tsx  # 配置侧边栏
│   │   ├── ContainerScroll.tsx       # 滚动容器
│   │   ├── GradientText.tsx          # 渐变文字
│   │   ├── Header.tsx                # 头部导航
│   │   ├── Layout.tsx                # 布局组件
│   │   ├── mapbox.tsx                # Mapbox 地图组件
│   │   ├── ModelContract.tsx         # 模型契约卡片
│   │   ├── ModelExecuteProcess.tsx   # 模型执行流程
│   │   ├── ShinyText.tsx             # 闪光文字效果
│   │   ├── StarBorder.tsx            # 星形边框
│   │   ├── TaskSpecCard.tsx          # 任务规格卡片
│   │   └── ToolTimeline.tsx          # 工具时间线
│   ├── pages/               # 页面组件
│   │   ├── Home.tsx         # 首页
│   │   ├── Decision.tsx     # 智能决策页（核心功能）
│   │   ├── Resources.tsx    # 资源管理页
│   │   ├── Index.tsx        # 指标体系页
│   │   └── About.tsx        # 关于页面
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── util/                # 工具函数
│   │   └── record.ts        # 分类标签记录
│   ├── lib/                 # 库文件
│   │   └── utils.ts
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── public/                  # 公共静态资源
├── components.json          # shadcn/ui 配置
├── tailwind.config.ts       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
├── package.json             # 项目依赖
└── README.md               # 项目文档
```

---

## 🔧 功能模块详解

### 1. Decision 页面（智能决策核心）

#### 状态管理
```tsx
// 对话管理
- activeChatId: 当前激活的对话 ID
- sessionList: 对话会话列表
- messages: 消息历史记录

// 模型相关
- recommendedModelName: 推荐模型名称
- recommendedModelDesc: 模型描述
- workflow: 工作流状态数组
- modelContract: 模型契约（输入输出要求）

// 数据管理
- uploadedFiles: 已上传文件列表
- convertedData: 转换后的数据
- scanResults: 扫描结果存储
- selectedScanFile: 选中的扫描文件

// UI 状态
- isScanning: 是否正在扫描
- isRunning: 是否正在运行模型
- showScanModal: 显示扫描结果模态窗口
```

#### 核心功能流程

**1. 发送消息流程**
```
用户输入 → 创建/选择会话 → 发送到后端 → 
EventSource 接收流式响应 → 解析事件类型 →
更新消息列表 → 渲染 UI
```

**2. 文件上传流程**
```
选择文件 → 上传到后端 → 格式转换 →
返回 fileUrl 和 conversion 数据 →
保存到 convertedData → 触发地图渲染
```

**3. 数据扫描流程**
```
批量扫描 → 并发上传文件 →
后端转换 → EventSource 接收扫描事件 →
解析工具调用 → 存储扫描结果 →
显示在模态窗口
```

**4. 地图渲染流程**
```
获取所有 convertedData →
遍历文件数组 →
判断数据类型（矢量/栅格）→
添加对应图层到地图 →
自动缩放到数据范围
```

### 2. MapboxViewer 组件

#### 支持的数据类型

**矢量数据**
- **Point（点）**：显示为圆点标记
- **LineString（线）**：显示为线条
- **Polygon（面）**：显示为填充多边形+边框

**栅格数据**
- **GeoTIFF**：转换为 PNG 图像后叠加显示
- **bbox**：边界框虚线显示

#### 关键功能

```tsx
// 图层管理
- 自动清除旧图层避免重复
- 为每个文件分配不同颜色
- 支持图层悬停和点击交互

// 坐标转换
- 自动计算数据边界
- 合并多个数据范围
- 自动缩放地图视图

// 性能优化
- 使用 useRef 追踪已加载数据源
- 避免重复渲染
- 深度比较数据变化
```

### 3. Resources 页面

#### 四级分类体系

```
一级分类（领域）
  └─ 二级分类（主题）
      └─ 三级分类（子主题）
          └─ 四级分类（具体资源类型）
```

#### 搜索功能
```tsx
// 组合查询
- 分类筛选：按四级菜单精确定位
- 关键字搜索：模糊匹配资源名称和描述
- 结果排序：按相关性或时间排序
- 分页加载：支持大量数据加载
```

---

## 🌐 环境配置

### 开发环境

```env
# .env.development
VITE_BACK_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=pk.your_development_token
```

### 生产环境

```env
# .env.production
VITE_BACK_URL=https://api.your-domain.com
VITE_MAPBOX_TOKEN=pk.your_production_token
```

---

## 📡 API 文档

### 会话管理

#### 获取会话列表
```http
GET /chat/sessions
```

#### 创建新会话
```http
POST /chat/sessions
Content-Type: application/json

{
  "title": "会话标题"
}
```

#### 获取会话消息
```http
GET /chat/sessions/:sessionId/messages
```

#### 发送消息（SSE）
```http
GET /chat/sessions/:sessionId/chat?query=用户消息
```

**返回事件类型**：
- `question`: 用户问题
- `thinking`: AI 思考过程
- `tool_call`: 工具调用开始
- `tool_result`: 工具结果返回
- `answer`: AI 最终回答
- `final`: 对话结束
- `error`: 错误信息

### 数据处理

#### 上传并转换
```http
POST /data/uploadAndConvert
Content-Type: multipart/form-data

file: <文件>
sessionId: <会话ID>
```

**返回**：
```json
{
  "success": true,
  "fileName": "range.tif",
  "fileSize": 234471,
  "filePath": "G:/path/to/file.tif",
  "fileUrl": "http://localhost:3000/uploads/default/file.tif",
  "conversion": {
    "type": "raster",
    "format": "geotiff",
    "bounds": [[minX, minY], [maxX, maxY]],
    "metadata": {...}
  }
}
```

#### 数据扫描（SSE）
```http
GET /data-mapping/sessions/:sessionId/data-scan?filePath=xxx
```

### 资源检索

#### 搜索资源
```http
POST /resources/search
Content-Type: application/json

{
  "categoryId": ["tag1", "tag2"],
  "keyword": "水文",
  "page": 1,
  "limit": 20
}
```

---

## 💻 开发指南

### 添加新页面

1. 在 `src/pages/` 创建组件
2. 在 `App.tsx` 中添加路由
3. 在 `Header.tsx` 中添加导航链接

```tsx
// 1. 创建页面组件
// src/pages/NewPage.tsx
export default function NewPage() {
  return <div>新页面</div>;
}

// 2. 添加路由
// App.tsx
import NewPage from './pages/NewPage';

<Route path="/new" element={<NewPage />} />

// 3. 添加导航
// components/Header.tsx
<Link to="/new">新页面</Link>
```

### 集成新的地图数据类型

```tsx
// mapbox.tsx
const addCustomLayer = (data: any, index: number) => {
  const sourceId = `custom-source-${index}`;
  const layerId = `custom-layer-${index}`;

  map.current.addSource(sourceId, {
    type: 'geojson',
    data: data,
  });

  map.current.addLayer({
    id: layerId,
    type: 'custom-type',
    source: sourceId,
    paint: {
      // 自定义样式
    },
  });
};
```

### 状态管理最佳实践

```tsx
// 使用 useMemo 优化性能
const memoizedData = useMemo(() => {
  return computeExpensiveValue(dependencies);
}, [dependencies]);

// 使用 useCallback 优化回调
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependencies]);
```

---

## 🚀 部署说明

### 构建优化

```bash
# 分析打包体积
npm run build -- --analyze

# 压缩构建
npm run build -- --minify
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/huanghe-demo/dist;
    index index.html;
    
    # 路由回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker 部署

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 提交 Issue

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档

### Pull Request 流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复格式问题
npm run lint:fix
```

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 团队

**开发团队**：
- 郑州大学国家超级计算中心
- 南京师范大学

**联系方式**：
- 📧 Email: your-email@example.com
- 🌐 Website: http://nscc.zzu.edu.cn/

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Mapbox GL JS](https://www.mapbox.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 📈 更新日志

### v1.0.0 (2026-03-09)

#### ✨ 新功能
- ✅ 完成智能对话系统开发
- ✅ 集成 Mapbox 地图可视化
- ✅ 支持矢量和栅格数据展示
- ✅ 实现文件上传和数据扫描
- ✅ 完成资源管理系统
- ✅ 实现会话管理功能

#### 🐛 Bug 修复
- 🔧 修复地图图层重复加载问题
- 🔧 优化 React 18 StrictMode 双渲染
- 🔧 修复文件 URL 路径问题

#### 🎨 UI/UX 改进
- 💄 优化暗黑模式适配
- 💄 改进响应式布局
- 💄 增强动画流畅度

---

## 📞 支持

遇到问题？

- 📖 查看 [文档](https://your-docs-url.com)
- 💬 加入 [讨论区](https://github.com/your-org/huanghe-demo/discussions)
- 🐛 提交 [Issue](https://github.com/your-org/huanghe-demo/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！⭐**

Made with ❤️ by GeoAgent Team

</div>
