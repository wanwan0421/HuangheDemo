export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

const AUTH_SESSION_KEY = "geoagent_auth_session";
const BACK_URL = import.meta.env.VITE_BACK_URL ?? "";
const AUTH_BASE_URL =`${BACK_URL}/auth`;

type AuthResult = {
  success: boolean;
  message: string;
  user?: AuthUser;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  user?: T;
  code?: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

const readSessionUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSessionUser = (user: AuthUser | null) => {
  if (!user) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
};

const toAuthUser = (raw: any): AuthUser | null => {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id ?? raw._id ?? raw.userId ?? "").trim();
  const username = String(raw.username ?? raw.name ?? "").trim();
  const email = String(raw.email ?? "").trim();
  const createdAt = String(raw.createdAt ?? raw.created_at ?? "").trim();

  if (!id || !email) return null;

  return {
    id,
    username: username || email.split("@")[0] || "User",
    email,
    createdAt: createdAt || new Date().toISOString(),
  };
};

const buildAuthUrl = (path: string) => {
  const base = AUTH_BASE_URL.endsWith("/")
    ? AUTH_BASE_URL.slice(0, -1)
    : AUTH_BASE_URL;
  return `${base}/${path}`;
};

const parseApiErrorMessage = (status: number, data?: ApiResponse<unknown>) => {
  if (data?.message) return data.message;
  if (status === 401) return "未登录或登录已过期";
  if (status === 409) return "账号已存在";
  return "请求失败，请稍后重试";
};

const postAuth = async <T>(path: string, body?: object): Promise<AuthResult & { raw?: T }> => {
  try {
    const response = await fetch(buildAuthUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json().catch(() => ({}))) as ApiResponse<T>;
    if (!response.ok || data.success === false) {
      return {
        success: false,
        message: parseApiErrorMessage(response.status, data),
      };
    }

    const rawUser = (data.user ?? data.data) as any;
    const user = toAuthUser(rawUser);
    if (user) {
      writeSessionUser(user);
    }

    return {
      success: true,
      message: data.message || "操作成功",
      user: user ?? undefined,
      raw: (data.data ?? data.user) as T | undefined,
    };
  } catch {
    return {
      success: false,
      message: "网络异常，请检查后端服务和跨域配置",
    };
  }
};

export const getCurrentUser = (): AuthUser | null => {
  return readSessionUser();
};

export const isLoggedIn = (): boolean => {
  return !!getCurrentUser();
};

export const register = async (payload: RegisterPayload): Promise<AuthResult> => {
  const username = payload.username.trim();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (!username || !email || !password) {
    return { success: false, message: "请完整填写注册信息" };
  }

  return postAuth<AuthUser>("register", {
    username,
    email,
    password,
  });
};

export const login = async (payload: LoginPayload): Promise<AuthResult> => {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (!email || !password) {
    return { success: false, message: "请输入邮箱和密码" };
  }

  return postAuth<AuthUser>("login", {
    email,
    password,
  });
};

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await fetch(buildAuthUrl("me"), {
      method: "GET",
      credentials: "include",
    });

    const data = (await response.json().catch(() => ({}))) as ApiResponse<AuthUser>;
    if (!response.ok || data.success === false) {
      writeSessionUser(null);
      return null;
    }

    const user = toAuthUser((data.user ?? data.data) as any);
    writeSessionUser(user);
    return user;
  } catch {
    return readSessionUser();
  }
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(buildAuthUrl("logout"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // ignore network errors here, local session will still be cleared
  } finally {
    writeSessionUser(null);
  }
};
