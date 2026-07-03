import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  LandcoverLegendItem,
  LandcoverTrendPoint,
} from '../lib/remoteSensing';

interface LandcoverTrendChartProps {
  legend: LandcoverLegendItem[];
  selectedCode: number | null;
  onSelectCode: (code: number) => void;
  data: LandcoverTrendPoint[];
  loading?: boolean;
  error?: string | null;
}

const formatArea = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function LandcoverTrendChart({
  legend,
  selectedCode,
  onSelectCode,
  data,
  loading = false,
  error = null,
}: LandcoverTrendChartProps) {
  const selectedItem =
    legend.find((item) => item.code === selectedCode) ?? legend[0] ?? null;

  if (!selectedItem) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm text-slate-500">暂无地类图例数据</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          年际变化趋势
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          展示 {selectedItem.name} 在不同年份的面积变化趋势
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {legend.map((item) => {
          const isActive = item.code === selectedItem.code;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => onSelectCode(item.code)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
          年际变化趋势数据加载中...
        </div>
      ) : error ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl bg-red-50 px-4 text-center text-sm text-red-500">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
          当前地类暂无趋势数据
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 18,
                left: -18,
                bottom: 10,
              }}
            >
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                width={52}
                axisLine={{ stroke: '#CBD5E1' }}
                tickFormatter={(value) => `${Number(value).toFixed(0)}`}
              />
              <Tooltip
                wrapperStyle={{ zIndex: 20 }}
                formatter={(value) => [`${formatArea(Number(value))} km²`, selectedItem.name]}
                labelFormatter={(label) => `${label} 年`}
              />
              <Line
                type="monotone"
                dataKey="areaKm2"
                stroke={selectedItem.color}
                strokeWidth={3}
                dot={{ r: 3, fill: selectedItem.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: selectedItem.color, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
