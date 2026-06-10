import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ObservationRecord {
  datetime: string;
  [key: string]: string | number | null | undefined;
}

interface MetricTrendChartProps {
  observations: ObservationRecord[];
  metricKey: string;
  metricLabel: string;
  metricUnit?: string;
}

interface ChartPoint {
  time: string;
  fullTime: string;
  value: number | null;
}

export default function MetricTrendChart({
  observations,
  metricKey,
  metricLabel,
  metricUnit,
}: MetricTrendChartProps) {
  const chartData: ChartPoint[] = observations.map((item) => {
    const rawValue = item[metricKey];

    return {
      time: formatXAxisTime(item.datetime),
      fullTime: formatTooltipTime(item.datetime),
      value: typeof rawValue === 'number' ? rawValue : null,
    };
  });

  const validValues = chartData
    .map((item) => item.value)
    .filter((value): value is number => typeof value === 'number');

  if (chartData.length === 0 || validValues.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
        当前指标暂无可绘制数据
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          {metricLabel} 监测变化趋势
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          展示所选站点在当前时间范围内的逐小时监测变化。
        </p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 12,
              right: 18,
              left: 0,
              bottom: 16,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="time"
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />

            <YAxis
              tick={{ fontSize: 11 }}
              width={48}
              label={
                metricUnit
                  ? {
                      value: metricUnit,
                      angle: -90,
                      position: 'insideLeft',
                      offset: 8,
                      style: {
                        fontSize: 11,
                      },
                    }
                  : undefined
              }
            />

            <Tooltip
              formatter={(value) => [
                value ?? '--',
                metricUnit ? `${metricLabel}（${metricUnit}）` : metricLabel,
              ]}
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as ChartPoint | undefined;
                return point?.fullTime ?? '';
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              name={metricLabel}
              stroke="#214adf"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatXAxisTime(dateTime: string) {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  return `${month}-${day} ${hour}:00`;
}

function formatTooltipTime(dateTime: string) {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:00`;
}
