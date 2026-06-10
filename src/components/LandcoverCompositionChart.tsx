import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type {
  LandcoverStatisticItem,
  LandcoverStatisticsResponse,
} from '../lib/remoteSensing';

interface LandcoverCompositionChartProps {
  data: LandcoverStatisticsResponse | null;
  loading?: boolean;
  error?: string | null;
}

const formatArea = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCompactArea = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)} 万`;
  }

  return formatArea(value);
};

const CompositionTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: LandcoverStatisticItem;
  }>;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <div className="mb-1 font-semibold text-slate-900">{item.name}</div>
      <div className="text-slate-600">面积：{formatArea(item.areaKm2)} km²</div>
      <div className="text-slate-600">占比：{item.percentage.toFixed(2)}%</div>
    </div>
  );
};

export default function LandcoverCompositionChart({
  data,
  loading = false,
  error = null,
}: LandcoverCompositionChartProps) {
  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4">
        <span className="text-sm text-slate-500">土地覆盖统计数据加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-red-100 bg-white px-4">
        <span className="text-center text-sm text-red-500">{error}</span>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4">
        <span className="text-sm text-slate-500">暂无土地覆盖统计数据</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          土地覆盖面积组成
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          展示 {data.year} 年黄河流域不同土地覆盖类型的面积占比
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative h-[230px] w-full max-w-[230px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.items}
                dataKey="areaKm2"
                nameKey="name"
                innerRadius={64}
                outerRadius={96}
                paddingAngle={1.5}
                stroke="none"
              >
                {data.items.map((item) => (
                  <Cell key={item.code} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                content={<CompositionTooltip />}
                wrapperStyle={{ zIndex: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium tracking-wide text-slate-400">
              总面积
            </span>
            <span className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {formatCompactArea(data.totalAreaKm2)}
            </span>
            <span className="text-xs text-slate-500">km²</span>
            <span className="mt-1 text-xs text-slate-400">{data.year} 年</span>
          </div>
        </div>

        <div className="mt-4 flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
          {data.items.map((item) => (
            <div key={item.code} className="flex items-center gap-2 text-sm text-slate-700">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
