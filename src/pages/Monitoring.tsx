import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LandcoverCompositionChart from '../components/LandcoverCompositionChart';
import LandcoverTrendChart from '../components/LandcoverTrendChart';
import MetricTrendChart from '../components/MetricTrendChart';
import UnifiedMonitoringMap from '../components/UnifiedMonitoringMap';
import {
  fetchHydrologyMonths,
  fetchHydrologyStatistics,
  fetchHydrologyYears,
  fetchLandcoverLegend,
  fetchLandcoverStatistics,
  fetchLandcoverTrend,
  fetchLandcoverYears,
  type HydrologyStatisticsResponse,
  type LandcoverLegendItem,
  type LandcoverStatisticsResponse,
  type LandcoverTrendPoint,
} from '../lib/remoteSensing';

type MonitoringModule = 'air-quality' | 'remote-sensing' | 'runoff';

interface StationDetail {
  stationCode: string;
  stationName: string;
  city: string;
  longitude: number;
  latitude: number;
  controlPoint?: string;
}

interface AirQualityObservation
  extends Record<string, string | number | null | undefined> {
  stationCode: string;
  datetime: string;
  date: string;
  hour: number;
  aqi: number | null;
  pm25: number | null;
  pm25_24h: number | null;
  pm10: number | null;
  pm10_24h: number | null;
  so2: number | null;
  so2_24h: number | null;
  no2: number | null;
  no2_24h: number | null;
  o3: number | null;
  o3_24h: number | null;
  o3_8h: number | null;
  o3_8h_24h: number | null;
  co: number | null;
  co_24h: number | null;
}

type MetricKey =
  | 'aqi'
  | 'pm25'
  | 'pm25_24h'
  | 'pm10'
  | 'pm10_24h'
  | 'so2'
  | 'so2_24h'
  | 'no2'
  | 'no2_24h'
  | 'o3'
  | 'o3_24h'
  | 'o3_8h'
  | 'o3_8h_24h'
  | 'co'
  | 'co_24h';

type MetricGroupKey =
  | 'comprehensive'
  | 'particulate'
  | 'ozone'
  | 'gaseous';

interface MetricOption {
  key: MetricKey;
  label: string;
  unit: string;
}

const DEFAULT_YEARS = [1990, 2000, 2010, 2020, 2025];
const DEFAULT_STATION_CODE = '1322A';
const DATA_MIN_DATE = '2020-05-08';
const DATA_MAX_DATE = '2020-10-10';
const AIR_QUALITY_BASE_URL = import.meta.env.VITE_BACK_URL?.trim() || '/api';

const METRIC_GROUPS: Record<
  MetricGroupKey,
  {
    label: string;
    metrics: MetricOption[];
  }
> = {
  comprehensive: {
    label: '综合指标',
    metrics: [{ key: 'aqi', label: 'AQI', unit: '' }],
  },
  particulate: {
    label: '颗粒物',
    metrics: [
      { key: 'pm25', label: 'PM2.5', unit: 'ug/m3' },
      { key: 'pm25_24h', label: 'PM2.5 24h', unit: 'ug/m3' },
      { key: 'pm10', label: 'PM10', unit: 'ug/m3' },
      { key: 'pm10_24h', label: 'PM10 24h', unit: 'ug/m3' },
    ],
  },
  ozone: {
    label: '臭氧指标',
    metrics: [
      { key: 'o3', label: 'O3', unit: 'ug/m3' },
      { key: 'o3_24h', label: 'O3 24h', unit: 'ug/m3' },
      { key: 'o3_8h', label: 'O3 8h', unit: 'ug/m3' },
      { key: 'o3_8h_24h', label: 'O3 8h 24h', unit: 'ug/m3' },
    ],
  },
  gaseous: {
    label: '气态污染物',
    metrics: [
      { key: 'so2', label: 'SO2', unit: 'ug/m3' },
      { key: 'so2_24h', label: 'SO2 24h', unit: 'ug/m3' },
      { key: 'no2', label: 'NO2', unit: 'ug/m3' },
      { key: 'no2_24h', label: 'NO2 24h', unit: 'ug/m3' },
      { key: 'co', label: 'CO', unit: 'mg/m3' },
      { key: 'co_24h', label: 'CO 24h', unit: 'mg/m3' },
    ],
  },
};

const RUNOFF_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

async function fetchStationObservations(
  stationCode: string,
  queryStartDate: string,
  queryEndDate: string,
) {
  const base = AIR_QUALITY_BASE_URL.endsWith('/')
    ? AIR_QUALITY_BASE_URL.slice(0, -1)
    : AIR_QUALITY_BASE_URL;
  const response = await fetch(
    `${base}/huanghe-monitoring/stations/${stationCode}/observations?startDate=${queryStartDate}&endDate=${queryEndDate}`,
  );

  if (!response.ok) {
    throw new Error('Failed to load station observations');
  }

  return (await response.json()) as AirQualityObservation[];
}

export default function Monitoring() {
  const [analysisModule, setAnalysisModule] =
    useState<MonitoringModule>('remote-sensing');
  const [showAirQuality, setShowAirQuality] = useState(true);
  const [showRemoteSensing, setShowRemoteSensing] = useState(true);
  const [showRunoff, setShowRunoff] = useState(false);

  const [selectedStationCode, setSelectedStationCode] =
    useState<string>(DEFAULT_STATION_CODE);

  const [availableYears, setAvailableYears] = useState<number[]>(DEFAULT_YEARS);
  const [selectedYear, setSelectedYear] = useState<number>(2020);
  const [loadingYears, setLoadingYears] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

  const [landcoverLegend, setLandcoverLegend] = useState<LandcoverLegendItem[]>(
    [],
  );
  const [legendError, setLegendError] = useState<string | null>(null);
  const [compositionData, setCompositionData] =
    useState<LandcoverStatisticsResponse | null>(null);
  const [loadingComposition, setLoadingComposition] = useState(false);
  const [compositionError, setCompositionError] = useState<string | null>(null);
  const [selectedLandcoverCode, setSelectedLandcoverCode] = useState<number | null>(
    null,
  );
  const [trendData, setTrendData] = useState<LandcoverTrendPoint[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  const [runoffYears, setRunoffYears] = useState<number[]>([]);
  const [selectedRunoffYear, setSelectedRunoffYear] = useState<number>(1980);
  const [loadingRunoffYears, setLoadingRunoffYears] = useState(false);
  const [runoffYearError, setRunoffYearError] = useState<string | null>(null);
  const [runoffMonths, setRunoffMonths] = useState<number[]>([]);
  const [selectedRunoffMonth, setSelectedRunoffMonth] = useState<number>(1);
  const [loadingRunoffMonths, setLoadingRunoffMonths] = useState(false);
  const [runoffMonthError, setRunoffMonthError] = useState<string | null>(null);
  const [runoffStatistics, setRunoffStatistics] =
    useState<HydrologyStatisticsResponse | null>(null);
  const [loadingRunoffStatistics, setLoadingRunoffStatistics] = useState(false);
  const [runoffStatisticsError, setRunoffStatisticsError] = useState<string | null>(
    null,
  );

  const [selectedStation, setSelectedStation] = useState<StationDetail | null>(null);
  const [stationLoading, setStationLoading] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);
  const [observations, setObservations] = useState<AirQualityObservation[]>([]);
  const [observationLoading, setObservationLoading] = useState(false);
  const [observationError, setObservationError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(DATA_MIN_DATE);
  const [endDate, setEndDate] = useState('2020-05-14');
  const currentDateRangeRef = useRef({
    startDate: DATA_MIN_DATE,
    endDate: '2020-05-14',
  });
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [selectedMetricGroup, setSelectedMetricGroup] =
    useState<MetricGroupKey>('comprehensive');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('aqi');

  useEffect(() => {
    if (!showAirQuality && !showRemoteSensing && !showRunoff) {
      setShowRemoteSensing(true);
    }
  }, [showAirQuality, showRemoteSensing, showRunoff]);

  useEffect(() => {
    const visibleModules: MonitoringModule[] = [];

    if (showAirQuality) {
      visibleModules.push('air-quality');
    }
    if (showRemoteSensing) {
      visibleModules.push('remote-sensing');
    }
    if (showRunoff) {
      visibleModules.push('runoff');
    }

    if (!visibleModules.includes(analysisModule) && visibleModules.length > 0) {
      setAnalysisModule(visibleModules[0]);
    }
  }, [analysisModule, showAirQuality, showRemoteSensing, showRunoff]);

  useEffect(() => {
    currentDateRangeRef.current = { startDate, endDate };
  }, [startDate, endDate]);

  useEffect(() => {
    const loadYears = async () => {
      try {
        setLoadingYears(true);
        setYearError(null);

        const years = await fetchLandcoverYears();

        if (years.length > 0) {
          setAvailableYears(years);
          setSelectedYear((currentYear) =>
            years.includes(currentYear) ? currentYear : years[years.length - 1],
          );
        }
      } catch (error) {
        console.error('Failed to load landcover years:', error);
        setYearError('土地覆盖年份数据加载失败，当前先使用默认年份。');
      } finally {
        setLoadingYears(false);
      }
    };

    void loadYears();
  }, []);

  useEffect(() => {
    const loadLegend = async () => {
      try {
        setLegendError(null);
        const legend = await fetchLandcoverLegend();
        setLandcoverLegend(legend);
        setSelectedLandcoverCode(
          (currentCode) => currentCode ?? legend[0]?.code ?? null,
        );
      } catch (error) {
        console.error('Failed to load landcover legend:', error);
        setLegendError('土地覆盖图例加载失败。');
      }
    };

    void loadLegend();
  }, []);

  useEffect(() => {
    const loadCompositionStatistics = async () => {
      try {
        setLoadingComposition(true);
        setCompositionError(null);

        const statistics = await fetchLandcoverStatistics(selectedYear);
        setCompositionData(statistics);
      } catch (error) {
        console.error('Failed to load landcover composition:', error);
        setCompositionData(null);
        setCompositionError('土地覆盖面积组成数据加载失败。');
      } finally {
        setLoadingComposition(false);
      }
    };

    void loadCompositionStatistics();
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedLandcoverCode) {
      setTrendData([]);
      return;
    }

    const loadTrend = async () => {
      try {
        setLoadingTrend(true);
        setTrendError(null);

        const trend = await fetchLandcoverTrend(selectedLandcoverCode);
        setTrendData(trend);
      } catch (error) {
        console.error('Failed to load landcover trend:', error);
        setTrendData([]);
        setTrendError('土地覆盖年际变化趋势数据加载失败。');
      } finally {
        setLoadingTrend(false);
      }
    };

    void loadTrend();
  }, [selectedLandcoverCode]);

  useEffect(() => {
    const loadRunoffYears = async () => {
      try {
        setLoadingRunoffYears(true);
        setRunoffYearError(null);

        const years = await fetchHydrologyYears();

        if (years.length > 0) {
          setRunoffYears(years);
          setSelectedRunoffYear((currentYear) =>
            years.includes(currentYear) ? currentYear : years[years.length - 1],
          );
        }
      } catch (error) {
        console.error('Failed to load hydrology years:', error);
        setRunoffYearError('径流量年份数据加载失败。');
      } finally {
        setLoadingRunoffYears(false);
      }
    };

    void loadRunoffYears();
  }, []);

  useEffect(() => {
    if (!selectedRunoffYear) {
      return;
    }

    const loadRunoffMonths = async () => {
      try {
        setLoadingRunoffMonths(true);
        setRunoffMonthError(null);

        const months = await fetchHydrologyMonths(selectedRunoffYear);

        if (months.length > 0) {
          setRunoffMonths(months);
          setSelectedRunoffMonth((currentMonth) =>
            months.includes(currentMonth) ? currentMonth : months[months.length - 1],
          );
          return;
        }

        setRunoffMonths([]);
        setSelectedRunoffMonth(1);
      } catch (error) {
        console.error('Failed to load hydrology months:', error);
        setRunoffMonths([]);
        setRunoffMonthError('径流量月份数据加载失败。');
      } finally {
        setLoadingRunoffMonths(false);
      }
    };

    void loadRunoffMonths();
  }, [selectedRunoffYear]);

  useEffect(() => {
    if (!selectedRunoffYear || !selectedRunoffMonth) {
      setRunoffStatistics(null);
      return;
    }

    const loadRunoffStatistics = async () => {
      try {
        setLoadingRunoffStatistics(true);
        setRunoffStatisticsError(null);

        const statistics = await fetchHydrologyStatistics(
          selectedRunoffYear,
          selectedRunoffMonth,
        );
        setRunoffStatistics(statistics);
      } catch (error) {
        console.error('Failed to load hydrology statistics:', error);
        setRunoffStatistics(null);
        setRunoffStatisticsError('径流量统计数据加载失败。');
      } finally {
        setLoadingRunoffStatistics(false);
      }
    };

    void loadRunoffStatistics();
  }, [selectedRunoffYear, selectedRunoffMonth]);

  const handleStationSelect = useCallback(async (stationCode: string) => {
    try {
      setSelectedStationCode(stationCode);
      setStationLoading(true);
      setObservationLoading(true);
      setStationError(null);
      setObservationError(null);
      setDateRangeError(null);

      const [stationResponse, observationData] = await Promise.all([
        fetch(
          `${AIR_QUALITY_BASE_URL.endsWith('/') ? AIR_QUALITY_BASE_URL.slice(0, -1) : AIR_QUALITY_BASE_URL}/huanghe-monitoring/stations/${stationCode}`,
        ),
        fetchStationObservations(
          stationCode,
          currentDateRangeRef.current.startDate,
          currentDateRangeRef.current.endDate,
        ),
      ]);

      if (!stationResponse.ok) {
        throw new Error('Failed to load station detail');
      }

      const stationDetail: StationDetail = await stationResponse.json();

      setSelectedStation(stationDetail);
      setObservations(observationData);
      setSelectedMetricGroup('comprehensive');
      setSelectedMetric('aqi');
    } catch (error) {
      console.error('Failed to load station related data:', error);
      setStationError('站点详情加载失败，请稍后重试。');
      setObservationError('监测指标数据加载失败，请稍后重试。');
    } finally {
      setStationLoading(false);
      setObservationLoading(false);
    }
  }, []);

  useEffect(() => {
    void handleStationSelect(DEFAULT_STATION_CODE);
  }, [handleStationSelect]);

  const currentMetricOptions = METRIC_GROUPS[selectedMetricGroup].metrics;
  const selectedMetricInfo =
    currentMetricOptions.find((metric) => metric.key === selectedMetric) ??
    Object.values(METRIC_GROUPS)
      .flatMap((group) => group.metrics)
      .find((metric) => metric.key === selectedMetric);

  const handleMetricGroupChange = (groupKey: MetricGroupKey) => {
    setSelectedMetricGroup(groupKey);

    const firstMetric = METRIC_GROUPS[groupKey].metrics[0];
    if (firstMetric) {
      setSelectedMetric(firstMetric.key);
    }
  };

  const handleRemoteLayerToggle = () => {
    if (showRemoteSensing && !showAirQuality && !showRunoff) {
      return;
    }

    if (showRemoteSensing) {
      setShowRemoteSensing(false);
      return;
    }

    setShowRemoteSensing(true);
    setShowRunoff(false);
  };

  const handleRunoffLayerToggle = () => {
    if (showRunoff && !showAirQuality && !showRemoteSensing) {
      return;
    }

    if (showRunoff) {
      setShowRunoff(false);
      return;
    }

    setShowRunoff(true);
    setShowRemoteSensing(false);
  };

  const observationTimeRange = useMemo(() => {
    if (observations.length === 0) {
      return null;
    }

    const firstTime = observations[0]?.datetime;
    const lastTime = observations[observations.length - 1]?.datetime;

    return {
      start: formatDateTime(firstTime),
      end: formatDateTime(lastTime),
    };
  }, [observations]);

  const handleDateRangeQuery = async () => {
    if (!selectedStation) {
      setDateRangeError('请先在地图中选择一个站点。');
      return;
    }

    if (!startDate || !endDate) {
      setDateRangeError('请选择完整的开始日期和结束日期。');
      return;
    }

    if (startDate > endDate) {
      setDateRangeError('开始日期不能晚于结束日期。');
      return;
    }

    try {
      setObservationLoading(true);
      setObservationError(null);
      setDateRangeError(null);

      const observationData = await fetchStationObservations(
        selectedStation.stationCode,
        startDate,
        endDate,
      );

      setObservations(observationData);
    } catch (error) {
      console.error('Failed to query station observations by date range:', error);
      setObservationError('监测指标数据加载失败，请稍后重试。');
    } finally {
      setObservationLoading(false);
    }
  };

  const getMetricAverage = (key: keyof AirQualityObservation): string => {
    const values = observations
      .map((item) => item[key])
      .filter((value): value is number => typeof value === 'number');

    if (values.length === 0) {
      return '--';
    }

    return (
      values.reduce((sum, value) => sum + value, 0) / values.length
    ).toFixed(1);
  };

  const getMetricMax = (key: keyof AirQualityObservation): string => {
    const values = observations
      .map((item) => item[key])
      .filter((value): value is number => typeof value === 'number');

    if (values.length === 0) {
      return '--';
    }

    return Math.max(...values).toFixed(1);
  };

  const summaryCards = [
    { title: 'AQI 均值', value: getMetricAverage('aqi'), unit: '' },
    { title: 'PM2.5 均值', value: getMetricAverage('pm25'), unit: 'ug/m3' },
    { title: 'PM10 均值', value: getMetricAverage('pm10'), unit: 'ug/m3' },
    { title: 'O3 最大值', value: getMetricMax('o3'), unit: 'ug/m3' },
  ];

  const compositionViewData = compositionData
    ? {
        ...compositionData,
        items: compositionData.items.map((item) => {
          const matchedLegend = landcoverLegend.find(
            (legendItem) => legendItem.code === item.code,
          );

          return {
            ...item,
            name: matchedLegend?.name || item.name || `地类 ${item.code}`,
            color: matchedLegend?.color || item.color,
          };
        }),
      }
    : null;

  const chartErrorMessage = compositionError ?? legendError;
  const mapTitle = getMapTitle({
    showAirQuality,
    showRemoteSensing,
    showRunoff,
    analysisModule,
  });

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="mx-auto max-w-[1850px]">
        <section className="mb-2 rounded-2xl border border-white/20 bg-white/60 px-5 py-3 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-slate-900">
                黄河流域多源融合监测地图
              </h1>
              <p className="mt-1 text-base leading-5 text-slate-500">
                融合空气质量站点、遥感土地覆盖和径流量结果，支持地图联动与专题切换。
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-100/70 px-3 py-2 shadow-inner">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  图层显示
                </div>
                <div className="inline-flex w-fit rounded-2xl bg-white/60 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAirQuality((current) =>
                        current && !showRemoteSensing && !showRunoff ? true : !current,
                      );
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      showAirQuality
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    空气质量
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoteLayerToggle}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      showRemoteSensing
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    遥感土地覆盖
                  </button>

                  <button
                    type="button"
                    onClick={handleRunoffLayerToggle}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      showRunoff
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    径流量
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  分析面板
                </div>
                <div className="inline-flex w-fit rounded-2xl bg-slate-100/80 p-1">
                  <button
                    type="button"
                    onClick={() => setAnalysisModule('air-quality')}
                    disabled={!showAirQuality}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      analysisModule === 'air-quality'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    空气质量
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalysisModule('remote-sensing')}
                    disabled={!showRemoteSensing}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      analysisModule === 'remote-sensing'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    遥感土地覆盖
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalysisModule('runoff')}
                    disabled={!showRunoff}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      analysisModule === 'runoff'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    径流量
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative min-h-[calc(100vh-170px)] overflow-hidden rounded-[28px] border border-slate-200/70 bg-slate-100/60 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-0">
            <UnifiedMonitoringMap
              showAirQuality={showAirQuality}
              showRemoteSensing={showRemoteSensing}
              showRunoff={showRunoff}
              selectedYear={selectedYear}
              selectedRunoffYear={selectedRunoffYear}
              selectedRunoffMonth={selectedRunoffMonth}
              selectedStationCode={selectedStationCode}
              onStationSelect={handleStationSelect}
            />
          </div>

          <div className="pointer-events-none absolute left-6 top-5 z-20 xl:left-[368px] xl:top-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 drop-shadow-[0_2px_10px_rgba(255,255,255,0.85)] xl:text-[20px]">
              {mapTitle}
            </h2>
          </div>

          {showRemoteSensing && landcoverLegend.length > 0 && (
            <div className="pointer-events-none absolute bottom-4 left-6 z-20 xl:bottom-6 xl:left-[368px]">
              <div className="space-y-2.5">
                {landcoverLegend.map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center gap-2 text-sm font-medium text-slate-800 drop-shadow-[0_2px_8px_rgba(255,255,255,0.95)]"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-black/5"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showRunoff && (
            <div className="pointer-events-none absolute bottom-4 left-6 z-20 xl:bottom-6 xl:left-[368px]">
              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.10)] backdrop-blur-sm">
                <div className="text-sm font-semibold text-slate-900">
                  月平均径流量
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span>低</span>
                  <div className="h-2.5 w-40 rounded-full bg-gradient-to-r from-sky-200 via-blue-500 via-[35%] via-emerald-400 via-[58%] via-yellow-300 via-[78%] to-red-500" />
                  <span>高</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>浅蓝</span>
                  <span>蓝</span>
                  <span>绿</span>
                  <span>黄</span>
                  <span>红</span>
                </div>
              </div>
            </div>
          )}

          <div className="pointer-events-none relative z-10 hidden min-h-[calc(100vh-170px)] xl:block">
            <aside className="pointer-events-auto absolute inset-y-0 left-0 w-[344px] overflow-hidden border-r border-white/50 bg-white/32 shadow-[18px_0_40px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <div className="flex h-full flex-col overflow-y-auto p-6 pt-14">
                {analysisModule === 'remote-sensing' ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                      Remote Sensing
                    </div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      遥感监测控制
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      切换土地覆盖年份，地图图层与右侧统计图会同步更新。
                    </p>

                    <div className="mt-6 rounded-2xl border border-white/70 bg-white/45 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        当前专题
                      </div>
                      <div className="mt-2 text-lg font-bold text-slate-900">
                        土地覆盖遥感监测
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">
                        基于黄河流域裁剪后的多年土地覆盖栅格瓦片服务。
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-semibold text-slate-900">
                          年份选择
                        </h4>
                        <div className="relative">
                          <select
                            value={selectedYear}
                            onChange={(event) =>
                              setSelectedYear(Number(event.target.value))
                            }
                            disabled={loadingYears}
                            className="min-w-[112px] appearance-none rounded-full border border-white/70 bg-white/85 px-3 py-2 pr-8 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {availableYears.map((year) => (
                              <option key={year} value={year}>
                                {year} 年
                              </option>
                            ))}
                          </select>
                          <span
                            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-500"
                            aria-hidden="true"
                          >
                            ▼
                          </span>
                        </div>
                      </div>
                      {yearError && (
                        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          {yearError}
                        </div>
                      )}
                    </div>
                  </>
                ) : analysisModule === 'runoff' ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                      Hydrology
                    </div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      径流量监测控制
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      选择年份和月份，地图中的径流量月平均栅格与统计信息会同步刷新。
                    </p>

                    <div className="mt-6 rounded-2xl border border-white/70 bg-white/45 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        当前专题
                      </div>
                      <div className="mt-2 text-lg font-bold text-slate-900">
                        径流量月平均监测
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">
                        基于黄河流域月平均径流量栅格瓦片与统计接口。
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-base font-semibold text-slate-900">
                            年份选择
                          </h4>
                          <div className="relative">
                            <select
                              value={selectedRunoffYear}
                              onChange={(event) =>
                                setSelectedRunoffYear(Number(event.target.value))
                              }
                              disabled={loadingRunoffYears}
                              className="min-w-[112px] appearance-none rounded-full border border-white/70 bg-white/85 px-3 py-2 pr-8 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {(runoffYears.length > 0 ? runoffYears : DEFAULT_YEARS).map(
                                (year) => (
                                  <option key={year} value={year}>
                                    {year} 年
                                  </option>
                                ),
                              )}
                            </select>
                            <span
                              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-500"
                              aria-hidden="true"
                            >
                              ▼
                            </span>
                          </div>
                        </div>
                        {runoffYearError && (
                          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                            {runoffYearError}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-base font-semibold text-slate-900">
                            月份选择
                          </h4>
                          <div className="relative">
                            <select
                              value={selectedRunoffMonth}
                              onChange={(event) =>
                                setSelectedRunoffMonth(Number(event.target.value))
                              }
                              disabled={loadingRunoffMonths || runoffMonths.length === 0}
                              className="min-w-[112px] appearance-none rounded-full border border-white/70 bg-white/85 px-3 py-2 pr-8 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {(runoffMonths.length > 0
                                ? runoffMonths
                                : RUNOFF_MONTH_OPTIONS
                              ).map((month) => (
                                <option key={month} value={month}>
                                  {month} 月
                                </option>
                              ))}
                            </select>
                            <span
                              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-500"
                              aria-hidden="true"
                            >
                              ▼
                            </span>
                          </div>
                        </div>
                        {runoffMonthError && (
                          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                            {runoffMonthError}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                      Air Quality
                    </div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      站点信息
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      点击地图中的空气质量站点，查看其基础信息与指标概览。
                    </p>
                    <div className="mt-5">
                      {renderAirStationPanel({
                        selectedStation,
                        stationLoading,
                        stationError,
                        summaryCards,
                      })}
                    </div>
                  </>
                )}
              </div>
            </aside>

            <aside className="pointer-events-auto absolute inset-y-0 right-0 w-[392px] overflow-hidden border-l border-white/50 bg-white/32 shadow-[-18px_0_40px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <div className="flex h-full flex-col overflow-y-auto p-6 pt-14">
                {analysisModule === 'remote-sensing' ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-600">
                      Analytics
                    </div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      遥感分析面板
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      展示当前年份的面积组成，并支持不同地类的变化趋势分析。
                    </p>

                    <div className="mt-5">
                      <LandcoverCompositionChart
                        data={compositionViewData}
                        loading={loadingComposition}
                        error={chartErrorMessage}
                      />
                    </div>

                    <div className="mt-4">
                      <LandcoverTrendChart
                        legend={landcoverLegend}
                        selectedCode={selectedLandcoverCode}
                        onSelectCode={setSelectedLandcoverCode}
                        data={trendData}
                        loading={loadingTrend}
                        error={trendError ?? legendError}
                      />
                    </div>
                  </>
                ) : analysisModule === 'runoff' ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-600">
                      Analytics
                    </div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      径流量分析面板
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      展示当前年月的参与天数、有效像元数量、平均径流量与最大径流量。
                    </p>

                    <div className="mt-5">
                      {renderRunoffAnalysisPanel({
                        data: runoffStatistics,
                        loading: loadingRunoffStatistics,
                        error:
                          runoffStatisticsError ??
                          runoffMonthError ??
                          runoffYearError,
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-600">
                      Analytics
                    </div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      空气质量分析面板
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      支持时间范围查询、指标切换以及站点监测趋势分析。
                    </p>
                    <div className="mt-5">
                      {renderAirAnalysisPanel({
                        selectedStation,
                        observations,
                        observationLoading,
                        observationError,
                        startDate,
                        endDate,
                        setStartDate,
                        setEndDate,
                        dateRangeError,
                        handleDateRangeQuery,
                        observationTimeRange,
                        selectedMetricGroup,
                        handleMetricGroupChange,
                        currentMetricOptions,
                        selectedMetric,
                        setSelectedMetric,
                        selectedMetricInfo,
                      })}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

function renderAirStationPanel({
  selectedStation,
  stationLoading,
  stationError,
  summaryCards,
}: {
  selectedStation: StationDetail | null;
  stationLoading: boolean;
  stationError: string | null;
  summaryCards: Array<{ title: string; value: string; unit: string }>;
}) {
  if (stationLoading) {
    return (
      <div className="rounded-2xl bg-blue-50 px-4 py-5 text-sm text-blue-700">
        正在读取站点信息...
      </div>
    );
  }

  if (stationError) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-5 text-sm text-red-700">
        {stationError}
      </div>
    );
  }

  if (!selectedStation) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
        <p className="text-sm leading-7 text-slate-500">当前未选中站点。</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          请点击地图中的空气质量站点查看详情。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-amber-50 p-5">
        <div className="text-sm font-semibold text-slate-700">当前选中站点</div>
        <h3 className="mt-1 text-2xl font-bold text-slate-900">
          {selectedStation.city} - {selectedStation.stationName}
        </h3>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-base font-semibold text-slate-900">基础信息</h4>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <InfoRow label="站点编码" value={selectedStation.stationCode} />
          <InfoRow label="所属城市" value={selectedStation.city} />
          <InfoRow label="经度" value={selectedStation.longitude.toFixed(6)} />
          <InfoRow label="纬度" value={selectedStation.latitude.toFixed(6)} />
          <InfoRow
            label="对照点"
            value={selectedStation.controlPoint === 'Y' ? '是' : '否'}
          />
        </div>
      </div>

      <div className="px-1 text-sm font-semibold text-slate-700">指标概览</div>
      <div className="grid grid-cols-2 gap-2.5">
        {summaryCards.map((card) => {
          const style = getSummaryCardStyle(card.title, card.value);

          return (
            <div key={card.title} className={`rounded-2xl px-3 py-3 ${style.card}`}>
              <div className={`text-xs font-medium ${style.title}`}>{card.title}</div>
              <div className={`mt-1.5 text-xl font-bold ${style.value}`}>
                {card.value}
              </div>
              {card.unit && (
                <div className={`mt-1 text-[11px] ${style.unit}`}>{card.unit}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderAirAnalysisPanel({
  selectedStation,
  observations,
  observationLoading,
  observationError,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  dateRangeError,
  handleDateRangeQuery,
  observationTimeRange,
  selectedMetricGroup,
  handleMetricGroupChange,
  currentMetricOptions,
  selectedMetric,
  setSelectedMetric,
  selectedMetricInfo,
}: {
  selectedStation: StationDetail | null;
  observations: AirQualityObservation[];
  observationLoading: boolean;
  observationError: string | null;
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  dateRangeError: string | null;
  handleDateRangeQuery: () => Promise<void>;
  observationTimeRange: { start: string; end: string } | null;
  selectedMetricGroup: MetricGroupKey;
  handleMetricGroupChange: (group: MetricGroupKey) => void;
  currentMetricOptions: MetricOption[];
  selectedMetric: MetricKey;
  setSelectedMetric: (metric: MetricKey) => void;
  selectedMetricInfo?: MetricOption;
}) {
  if (observationLoading) {
    return (
      <div className="rounded-2xl bg-blue-50 px-4 py-5 text-sm text-blue-700">
        正在读取监测指标数据...
      </div>
    );
  }

  if (observationError) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-5 text-sm text-red-700">
        {observationError}
      </div>
    );
  }

  if (!selectedStation || observations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
        <p className="text-sm leading-7 text-slate-500">
          当前还没有可展示的监测分析数据。
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          请先选择一个站点，或重新查询时间范围后再查看趋势图。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-base font-semibold text-slate-900">时间范围</h4>
        <p className="mt-2 text-sm text-slate-500">
          选择监测数据查询的开始日期和结束日期。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">开始日期</span>
            <input
              type="date"
              value={startDate}
              min={DATA_MIN_DATE}
              max={DATA_MAX_DATE}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">结束日期</span>
            <input
              type="date"
              value={endDate}
              min={DATA_MIN_DATE}
              max={DATA_MAX_DATE}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {dateRangeError && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {dateRangeError}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleDateRangeQuery()}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          查询该时间段数据
        </button>

        <div className="mt-3 text-xs leading-5 text-slate-400">
          可选数据范围：2020-05-08 至 2020-10-10
        </div>

        {observationTimeRange && (
          <div className="mt-2 text-xs leading-5 text-slate-400">
            当前数据展示范围：{observationTimeRange.start} 至{' '}
            {observationTimeRange.end}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-base font-semibold text-slate-900">指标切换</h4>
        <p className="mt-2 text-sm text-slate-500">
          选择指标类别和具体指标，右侧趋势图会同步切换。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(METRIC_GROUPS) as MetricGroupKey[]).map((groupKey) => {
            const group = METRIC_GROUPS[groupKey];
            const isActive = selectedMetricGroup === groupKey;

            return (
              <button
                key={groupKey}
                type="button"
                onClick={() => handleMetricGroupChange(groupKey)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-400 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {currentMetricOptions.map((metric) => {
            const isActive = selectedMetric === metric.key;

            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedMetric(metric.key)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>

      <MetricTrendChart
        observations={observations}
        metricKey={selectedMetric}
        metricLabel={selectedMetricInfo?.label ?? '--'}
        metricUnit={selectedMetricInfo?.unit ?? ''}
      />
    </div>
  );
}

function renderRunoffAnalysisPanel({
  data,
  loading,
  error,
}: {
  data: HydrologyStatisticsResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-blue-50 px-4 py-5 text-sm text-blue-700">
        正在读取径流量统计数据...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
        <p className="text-sm leading-7 text-slate-500">当前暂无径流量统计数据。</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          请切换年份或月份后重试。
        </p>
      </div>
    );
  }

  const cards = [
    { title: '参与天数', value: `${data.daysCount}`, unit: '天' },
    { title: '有效像元数量', value: formatInteger(data.validPixelCount), unit: '' },
    { title: '平均径流量', value: formatDecimal(data.averageRunoff), unit: '' },
    { title: '最大径流量', value: formatDecimal(data.maxRunoff), unit: '' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">统计概览</h4>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          当前展示 {data.year} 年 {data.month} 月黄河流域径流量统计结果。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">{card.title}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {card.value}
            </div>
            {card.unit && (
              <div className="mt-1 text-xs text-slate-400">{card.unit}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function getSummaryCardStyle(title: string, value: string | number) {
  const num = Number(value);

  if (Number.isNaN(num)) {
    return {
      card: 'bg-slate-50',
      title: 'text-slate-500',
      value: 'text-slate-900',
      unit: 'text-slate-500',
    };
  }

  let isWarning = false;

  switch (title) {
    case 'AQI 均值':
      isWarning = num > 100;
      break;
    case 'PM2.5 均值':
      isWarning = num > 60;
      break;
    case 'PM10 均值':
      isWarning = num > 120;
      break;
    case 'O3 最大值':
      isWarning = num > 200;
      break;
  }

  return isWarning
    ? {
        card: 'bg-[#FFF3F3] border border-[#F4CCCC]',
        title: 'text-[#C24141]',
        value: 'text-[#991B1B]',
        unit: 'text-[#B65A5A]',
      }
    : {
        card: 'bg-[#F1FBF5] border border-[#CDEEDB]',
        title: 'text-[#2F855A]',
        value: 'text-[#166534]',
        unit: 'text-[#2F855A]',
      };
}

function formatDateTime(dateTime: string) {
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

function formatInteger(value: number) {
  return value.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
  });
}

function formatDecimal(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMapTitle({
  showAirQuality,
  showRemoteSensing,
  showRunoff,
  analysisModule,
}: {
  showAirQuality: boolean;
  showRemoteSensing: boolean;
  showRunoff: boolean;
  analysisModule: MonitoringModule;
}) {
  const visibleCount = [showAirQuality, showRemoteSensing, showRunoff].filter(Boolean)
    .length;

  if (visibleCount > 1) {
    return '黄河流域多源融合监测地图';
  }

  if (showRunoff || analysisModule === 'runoff') {
    return '黄河流域径流量月平均空间分布';
  }

  if (showRemoteSensing || analysisModule === 'remote-sensing') {
    return '黄河流域土地覆盖空间分布';
  }

  return '黄河流域空气质量监测站点分布';
}
