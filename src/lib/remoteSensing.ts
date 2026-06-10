export const REMOTE_SENSING_BASE_URL =
  import.meta.env.VITE_REMOTE_SENSING_URL ??
  'http://127.0.0.1:8001/api/remote-sensing';

const REMOTE_SENSING_REQUEST_TIMEOUT_MS = 5000;

export interface LandcoverLegendItem {
  code: number;
  name: string;
  color: string;
}

export interface LandcoverStatisticItem {
  code: number;
  name: string;
  areaKm2: number;
  percentage: number;
  color: string;
}

export interface LandcoverStatisticsResponse {
  year: number;
  totalAreaKm2: number;
  items: LandcoverStatisticItem[];
}

export interface LandcoverTrendPoint {
  year: number;
  areaKm2: number;
}

export interface HydrologyStatisticsResponse {
  year: number;
  month: number;
  daysCount: number;
  validPixelCount: number;
  averageRunoff: number;
  maxRunoff: number;
}

interface LandcoverYearsApiResponse {
  years: number[];
}

interface LandcoverLegendApiItem {
  code?: number;
  landcover_code?: number;
  classId?: number;
  class_id?: number;
  name?: string;
  className?: string;
  class_name?: string;
  label?: string;
  color?: string;
  hex?: string;
}

interface LandcoverStatisticApiItem {
  code?: number;
  landcover_code?: number;
  classId?: number;
  class_id?: number;
  name?: string;
  areaKm2?: number;
  area_km2?: number;
  percentage?: number;
  color?: string;
}

interface LandcoverStatisticsApiResponse {
  year?: number;
  totalAreaKm2?: number;
  total_area_km2?: number;
  items?: LandcoverStatisticApiItem[];
  data?: LandcoverStatisticApiItem[];
}

interface LandcoverTrendApiItem {
  year?: number;
  areaKm2?: number;
  area_km2?: number;
  area?: number;
  value?: number;
}

interface LandcoverTrendApiResponse {
  code?: number;
  name?: string;
  color?: string;
  unit?: string;
  series?: LandcoverTrendApiItem[];
  items?: LandcoverTrendApiItem[];
  data?: LandcoverTrendApiItem[];
}

interface HydrologyYearsApiResponse {
  years?: number[];
}

interface HydrologyMonthApiItem {
  month?: number;
  value?: number;
}

interface HydrologyStatisticsApiResponse {
  year?: number;
  month?: number;
  daysCount?: number;
  days_count?: number;
  observationDays?: number;
  observation_days?: number;
  validPixelCount?: number;
  valid_pixel_count?: number;
  effectivePixelCount?: number;
  effective_pixel_count?: number;
  averageRunoff?: number;
  average_runoff?: number;
  meanRunoff?: number;
  mean_runoff?: number;
  maxRunoff?: number;
  max_runoff?: number;
}

type ListResponse<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      legend?: T[];
      years?: number[];
      months?: number[];
    };

const buildRemoteSensingUrl = (path: string) => {
  const base = REMOTE_SENSING_BASE_URL.endsWith('/')
    ? REMOTE_SENSING_BASE_URL.slice(0, -1)
    : REMOTE_SENSING_BASE_URL;

  return `${base}/${path.replace(/^\/+/, '')}`;
};

const requestRemoteSensingJson = async <T>(path: string): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REMOTE_SENSING_REQUEST_TIMEOUT_MS,
  );

  let response: Response;

  try {
    response = await fetch(buildRemoteSensingUrl(path), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Remote sensing request timed out');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Remote sensing request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const getListPayload = <T>(response: ListResponse<T>): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.legend)) {
    return response.legend;
  }

  if (Array.isArray(response.months)) {
    return response.months as T[];
  }

  return [];
};

const toCode = (item: {
  code?: number;
  landcover_code?: number;
  classId?: number;
  class_id?: number;
}) =>
  Number(item.code ?? item.landcover_code ?? item.classId ?? item.class_id ?? 0);

const toNumber = (...values: Array<number | string | null | undefined>) => {
  for (const value of values) {
    const next = Number(value);

    if (!Number.isNaN(next)) {
      return next;
    }
  }

  return 0;
};

export const fetchLandcoverYears = async (): Promise<number[]> => {
  const response = await requestRemoteSensingJson<LandcoverYearsApiResponse>(
    '/landcover/years',
  );

  return (response.years ?? [])
    .map((year) => Number(year))
    .filter((year) => !Number.isNaN(year));
};

export const fetchLandcoverLegend = async (): Promise<LandcoverLegendItem[]> => {
  const response = await requestRemoteSensingJson<ListResponse<LandcoverLegendApiItem>>(
    '/landcover/legend',
  );

  return getListPayload(response)
    .map((item) => ({
      code: toCode(item),
      name:
        item.name?.trim() ||
        item.className?.trim() ||
        item.class_name?.trim() ||
        item.label?.trim() ||
        '',
      color: item.color?.trim() || item.hex?.trim() || '#94A3B8',
    }))
    .filter((item) => item.code > 0);
};

export const fetchLandcoverStatistics = async (
  year: number,
): Promise<LandcoverStatisticsResponse> => {
  const response =
    await requestRemoteSensingJson<LandcoverStatisticsApiResponse>(
      `/landcover/statistics/${year}`,
    );

  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.data)
      ? response.data
      : [];

  return {
    year: Number(response.year ?? year),
    totalAreaKm2: Number(
      response.totalAreaKm2 ?? response.total_area_km2 ?? 0,
    ),
    items: items.map((item) => {
      const code = toCode(item);

      return {
        code,
        name: item.name?.trim() || '',
        areaKm2: Number(item.areaKm2 ?? item.area_km2 ?? 0),
        percentage: Number(item.percentage ?? 0),
        color: item.color?.trim() || '#94A3B8',
      };
    }),
  };
};

export const fetchLandcoverTrend = async (
  code: number,
): Promise<LandcoverTrendPoint[]> => {
  const response = await requestRemoteSensingJson<
    ListResponse<LandcoverTrendApiItem> | LandcoverTrendApiResponse
  >(
    `/landcover/trend/${code}`,
  );

  const series = Array.isArray(response)
    ? response
    : Array.isArray((response as LandcoverTrendApiResponse).series)
      ? (response as LandcoverTrendApiResponse).series ?? []
      : getListPayload(response as ListResponse<LandcoverTrendApiItem>);

  return series
    .map((item) => ({
      year: Number(item.year ?? 0),
      areaKm2: Number(item.areaKm2 ?? item.area_km2 ?? item.area ?? item.value ?? 0),
    }))
    .filter((item) => item.year > 0)
    .sort((a, b) => a.year - b.year);
};

export const fetchHydrologyYears = async (): Promise<number[]> => {
  const response = await requestRemoteSensingJson<
    HydrologyYearsApiResponse | ListResponse<number>
  >('/hydrology/years');

  const years = Array.isArray((response as HydrologyYearsApiResponse).years)
    ? (response as HydrologyYearsApiResponse).years ?? []
    : getListPayload(response as ListResponse<number>);

  return years
    .map((year) => Number(year))
    .filter((year) => !Number.isNaN(year))
    .sort((a, b) => a - b);
};

export const fetchHydrologyMonths = async (year: number): Promise<number[]> => {
  const response = await requestRemoteSensingJson<
    ListResponse<number | HydrologyMonthApiItem>
  >(`/hydrology/months/${year}`);

  return getListPayload(response)
    .map((item) =>
      typeof item === 'number'
        ? Number(item)
        : Number(item.month ?? item.value ?? 0),
    )
    .filter((month) => month >= 1 && month <= 12)
    .sort((a, b) => a - b);
};

export const fetchHydrologyStatistics = async (
  year: number,
  month: number,
): Promise<HydrologyStatisticsResponse> => {
  const response = await requestRemoteSensingJson<HydrologyStatisticsApiResponse>(
    `/hydrology/statistics/${year}/${month}`,
  );

  return {
    year: toNumber(response.year, year),
    month: toNumber(response.month, month),
    daysCount: toNumber(
      response.daysCount,
      response.days_count,
      response.observationDays,
      response.observation_days,
    ),
    validPixelCount: toNumber(
      response.validPixelCount,
      response.valid_pixel_count,
      response.effectivePixelCount,
      response.effective_pixel_count,
    ),
    averageRunoff: toNumber(
      response.averageRunoff,
      response.average_runoff,
      response.meanRunoff,
      response.mean_runoff,
    ),
    maxRunoff: toNumber(response.maxRunoff, response.max_runoff),
  };
};
