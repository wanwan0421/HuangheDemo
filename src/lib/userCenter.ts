import { getCurrentUser } from "./auth";

const BACK_URL = import.meta.env.VITE_BACK_URL;

export const DATA_CENTER_STORAGE_KEY = "geoagent_data_center";
export const FAVORITE_MODELS_STORAGE_KEY = "geoagent_favorite_models";
export const FAVORITE_DATA_STORAGE_KEY = "geoagent_favorite_data";
export const SIMULATION_RESULTS_STORAGE_KEY = "geoagent_simulation_results";
export const USER_PROFILE_STORAGE_KEY = "geoagent_user_profile";

export type FavoriteModel = {
    id: string;
    name: string;
    description?: string;
    source?: string;
    createdAt: string;
};

export type FavoriteData = {
    id: string;
    name: string;
    source?: string;
    fromModel?: string;
    url?: string;
    runAt?: string;
    createdAt: string;
};

export type SimulationResultItem = {
    id: string;
    name: string;
    fromModel?: string;
    url?: string;
    source: "model-result";
    createdAt: string;
    meta?: Record<string, any>;
};

export type UserProfile = {
    name: string;
    email: string;
    org: string;
    role: string;
    avatar?: string;
    bio?: string;
};

const safeParseArray = <T>(raw: string | null): T[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getLocalArray = <T>(key: string): T[] => {
    return safeParseArray<T>(localStorage.getItem(key));
};

const setLocalArray = <T>(key: string, next: T[]) => {
    localStorage.setItem(key, JSON.stringify(next));
};

const getUserId = () => {
    return getCurrentUser()?.id || localStorage.getItem("userId") || "default-user";
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
        credentials: "include",
        ...init,
    });

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
    }

    const json = await res.json();

    return json?.data ?? json;
};

const normalizeFavoriteModel = (item: any): FavoriteModel => ({
    id: item?.id || item?._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: item?.name || "",
    description: item?.description,
    source: item?.source,
    createdAt: item?.createdAt || new Date().toLocaleString(),
});

const normalizeFavoriteData = (item: any): FavoriteData => ({
    id: item?.id || item?._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: item?.name || "",
    source: item?.source,
    fromModel: item?.fromModel,
    url: item?.url,
    runAt: item?.runAt ?? item?.meta?.runAt,
    createdAt: item?.createdAt || new Date().toLocaleString(),
});

const normalizeSimulationResult = (item: any): SimulationResultItem => ({
    id: item?.id || item?._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: item?.name || "",
    fromModel: item?.fromModel,
    url: item?.url,
    source: "model-result",
    createdAt: item?.createdAt || new Date().toLocaleString(),
    meta: item?.meta,
});

const tryGetServerArray = async <T>(path: string, normalizer: (item: any) => T, fallbackKey: string): Promise<T[]> => {
    try {
        const data = await requestJson<any>(`${BACK_URL}${path}`);
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const normalized = list.map(normalizer);
        setLocalArray(fallbackKey, normalized as any[]);
        return normalized;
    } catch {
        return getLocalArray<T>(fallbackKey);
    }
};

const toEncoded = (value: string) => encodeURIComponent(value);
const buildFavoriteDataKey = (item: Pick<FavoriteData, "name" | "fromModel" | "url" | "runAt">) =>
    `${item.name}::${item.fromModel || ""}::${item.url || ""}::${item.runAt || ""}`;

export const getFavoriteModels = async (): Promise<FavoriteModel[]> => {
    const userId = getUserId();

    return tryGetServerArray<FavoriteModel>(`/user/favorites/models?userId=${userId}`, normalizeFavoriteModel, FAVORITE_MODELS_STORAGE_KEY);
};

export const isModelFavorited = async (name: string): Promise<boolean> => {
    const favorites = await getFavoriteModels();
    return favorites.some((item) => item.name === name);
};

export const toggleFavoriteModel = async (model: Pick<FavoriteModel, "name" | "description" | "source">): Promise<boolean> => {
    const userId = getUserId();
    const current = await getFavoriteModels();
    const exists = current.some((item) => item.name === model.name);

    if (exists) {
        try {
            await requestJson(`${BACK_URL}/user/favorites/models/${toEncoded(model.name)}?userId=${userId}`, {
                method: "DELETE",
            });
        } catch {
            const next = current.filter((item) => item.name !== model.name);
            setLocalArray(FAVORITE_MODELS_STORAGE_KEY, next);
            return false;
        }
        const next = current.filter((item) => item.name !== model.name);
        setLocalArray(FAVORITE_MODELS_STORAGE_KEY, next);
        return false;
    }

    const payload = {
        userId: userId,
        name: model.name,
        description: model.description,
        source: model.source,
    };

    try {
        const created = await requestJson<any>(`${BACK_URL}/user/favorites/models`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const item = normalizeFavoriteModel(created?.data || created || payload);
        setLocalArray(FAVORITE_MODELS_STORAGE_KEY, [item, ...current.filter((f) => f.name !== item.name)]);
        return true;
    } catch {
        const item = normalizeFavoriteModel({ ...payload, createdAt: new Date().toLocaleString() });
        setLocalArray(FAVORITE_MODELS_STORAGE_KEY, [item, ...current.filter((f) => f.name !== item.name)]);
        return true;
    }
};

export const getFavoriteData = async (): Promise<FavoriteData[]> => {
    const userId = getUserId();
    return tryGetServerArray<FavoriteData>(`/user/favorites/data?userId=${userId}`, normalizeFavoriteData, FAVORITE_DATA_STORAGE_KEY);
};

export const isDataFavorited = async (name: string): Promise<boolean> => {
    const favorites = await getFavoriteData();
    return favorites.some((item) => item.name === name);
};

export const toggleFavoriteData = async (data: Pick<FavoriteData, "name" | "source" | "fromModel" | "url" | "runAt">): Promise<boolean> => {
    const userId = getUserId();
    const current = await getFavoriteData();
    const targetKey = buildFavoriteDataKey(data);
    const exists = current.some((item) => buildFavoriteDataKey(item) === targetKey);

    if (exists) {
        try {
            await requestJson(`${BACK_URL}/user/favorites/data/${toEncoded(data.name)}?userId=${userId}`, {
                method: "DELETE",
            });
        } catch {
            const next = current.filter((item) => buildFavoriteDataKey(item) !== targetKey);
            setLocalArray(FAVORITE_DATA_STORAGE_KEY, next);
            return false;
        }

        const next = current.filter((item) => buildFavoriteDataKey(item) !== targetKey);
        setLocalArray(FAVORITE_DATA_STORAGE_KEY, next);
        return false;
    }

    const payload = {
        userId: userId,
        name: data.name,
        source: data.source,
        fromModel: data.fromModel,
        url: data.url,
        runAt: data.runAt,
    };

    try {
        const created = await requestJson<any>(`${BACK_URL}/user/favorites/data`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const item = normalizeFavoriteData(created?.data || created || payload);
        setLocalArray(FAVORITE_DATA_STORAGE_KEY, [item, ...current.filter((f) => buildFavoriteDataKey(f) !== targetKey)]);
        return true;
    } catch {
        const item = normalizeFavoriteData({ ...payload, createdAt: new Date().toLocaleString() });
        setLocalArray(FAVORITE_DATA_STORAGE_KEY, [item, ...current.filter((f) => buildFavoriteDataKey(f) !== targetKey)]);
        return true;
    }
};

export const addFavoriteData = async (data: Pick<FavoriteData, "name" | "source" | "fromModel" | "url" | "runAt">): Promise<boolean> => {
    const userId = getUserId();
    const current = await getFavoriteData();
    const targetKey = buildFavoriteDataKey(data);
    const exists = current.some((item) => buildFavoriteDataKey(item) === targetKey);
    if (exists) return true;

    const payload = {
        userId: userId,
        name: data.name,
        source: data.source,
        fromModel: data.fromModel,
        url: data.url,
        runAt: data.runAt,
    };

    try {
        const created = await requestJson<any>(`${BACK_URL}/user/favorites/data`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const item = normalizeFavoriteData(created?.data || created || payload);
        setLocalArray(FAVORITE_DATA_STORAGE_KEY, [item, ...current.filter((f) => buildFavoriteDataKey(f) !== targetKey)]);
        return true;
    } catch {
        const item = normalizeFavoriteData({ ...payload, createdAt: new Date().toLocaleString() });
        setLocalArray(FAVORITE_DATA_STORAGE_KEY, [item, ...current.filter((f) => buildFavoriteDataKey(f) !== targetKey)]);
        return true;
    }
};

export const getSimulationResults = async (): Promise<SimulationResultItem[]> => {
    const userId = getUserId();
    return tryGetServerArray<SimulationResultItem>(`/user/simulation-results?userId=${userId}`, normalizeSimulationResult, SIMULATION_RESULTS_STORAGE_KEY);
};

export const addSimulationResult = async (result: Omit<SimulationResultItem, "id" | "source" | "createdAt">) => {
    const userId = getUserId();
    const current = await getSimulationResults();
    const runAt = String(result?.meta?.runAt || "");
    const exists = current.some((item) =>
        item.name === result.name &&
        (item.fromModel || "") === (result.fromModel || "") &&
        (item.url || "") === (result.url || "") &&
        String(item?.meta?.runAt || "") === runAt
    );

    if (exists) {
        return current.find((item) =>
            item.name === result.name &&
            (item.fromModel || "") === (result.fromModel || "") &&
            (item.url || "") === (result.url || "") &&
            String(item?.meta?.runAt || "") === runAt
        ) as SimulationResultItem;
    }

    const payload = {
        userId: userId,
        name: result.name,
        fromModel: result.fromModel,
        url: result.url,
        source: "model-result",
        meta: result.meta,
    };

    try {
        const created = await requestJson<any>(`${BACK_URL}/user/simulation-results`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const item = normalizeSimulationResult(created?.data || created || payload);
        setLocalArray(SIMULATION_RESULTS_STORAGE_KEY, [item, ...current]);
        return item;
    } catch {
        const item = normalizeSimulationResult({ ...payload, createdAt: new Date().toLocaleString() });
        setLocalArray(SIMULATION_RESULTS_STORAGE_KEY, [item, ...current]);
        return item;
    }
};

export const getUserProfile = (): UserProfile => {
    const user = getCurrentUser();
    const fallback: UserProfile = {
        name: user?.username || "User",
        email: user?.email || "user@example.com",
        org: "Unknown Organization",
        role: "Analyst",
        avatar: "",
        bio: "",
    };

    try {
        const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== "object") return fallback;
        return {
            ...fallback,
            ...parsed,
            email: user?.email || parsed.email || fallback.email,
            name: parsed.name || user?.username || fallback.name,
        };
    } catch {
        return fallback;
    }
};

export const saveUserProfile = (profile: UserProfile) => {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
};
