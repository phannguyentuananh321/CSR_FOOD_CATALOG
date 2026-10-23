// Lớp gọi API tập trung: đọc base URL từ cấu hình, phân biệt lỗi nghiệp vụ,
// lỗi HTTP và lỗi mạng; không để lộ chi tiết kỹ thuật ra ngoài.
import type { Chef, Dish, Ingredient, ListResponse, UploadResult } from '../types';

export type ApiErrorKind = 'business' | 'http' | 'network';

export class ApiError extends Error {
  kind: ApiErrorKind;
  code?: string;
  fields?: Record<string, string>;
  status?: number;

  constructor(kind: ApiErrorKind, message: string, init?: { code?: string; fields?: Record<string, string>; status?: number }) {
    super(message);
    this.kind = kind;
    this.code = init?.code;
    this.fields = init?.fields;
    this.status = init?.status;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '');

if (!BASE_URL) {
  // eslint-disable-next-line no-console
  console.error('Thiếu VITE_API_BASE_URL trong file .env của web.');
}

const TECHNICAL_MESSAGE = 'Không kết nối được với máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau ít phút.';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('network', TECHNICAL_MESSAGE);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  // Endpoint sai / lỗi kỹ thuật: HTTP status != 200.
  if (res.status !== 200) {
    const message =
      res.status === 404
        ? 'Đường dẫn API không tồn tại.'
        : 'Hệ thống đang gặp sự cố tạm thời. Vui lòng quay lại sau ít phút.';
    throw new ApiError('http', message, { status: res.status });
  }

  const payload = json as { ok?: boolean; data?: T; error?: { code?: string; message?: string; fields?: Record<string, string> } } | null;
  if (!payload || typeof payload !== 'object' || typeof payload.ok !== 'boolean') {
    throw new ApiError('http', 'Phản hồi từ máy chủ không hợp lệ.', { status: res.status });
  }

  if (!payload.ok) {
    throw new ApiError('business', payload.error?.message || 'Yêu cầu không thành công.', {
      code: payload.error?.code,
      fields: payload.error?.fields,
    });
  }

  return payload.data as T;
}

// Response danh sách: server gửi { ok, data: [...], meta } — gom lại thành { data, meta }.
export async function requestList<T>(path: string): Promise<ListResponse<T>> {
  const payload = await rawRequest(path);
  return { data: payload.data as T[], meta: payload.meta as ListResponse<T>['meta'] };
}

interface RawPayload {
  ok?: boolean;
  data?: unknown;
  meta?: ListResponse<unknown>['meta'];
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}

async function rawRequest(path: string, options: RequestOptions = {}): Promise<RawPayload> {
  const { method = 'GET', body } = options;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('network', TECHNICAL_MESSAGE);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  // Endpoint sai / lỗi kỹ thuật: HTTP status != 200.
  if (res.status !== 200) {
    const message =
      res.status === 404
        ? 'Đường dẫn API không tồn tại.'
        : 'Hệ thống đang gặp sự cố tạm thờ\u0069. Vui lòng quay lại sau ít phút.';
    throw new ApiError('http', message, { status: res.status });
  }

  const payload = json as RawPayload | null;
  if (!payload || typeof payload !== 'object' || typeof payload.ok !== 'boolean') {
    throw new ApiError('http', 'Phản hồi từ máy chủ không hợp lệ.', { status: res.status });
  }

  if (!payload.ok) {
    throw new ApiError('business', payload.error?.message || 'Yêu cầu không thành công.', {
      code: payload.error?.code,
      fields: payload.error?.fields,
    });
  }

  return payload;
}

export type UploadFolder = 'dishes' | 'ingredient' | 'chef';

export async function uploadImage(file: File, folder: UploadFolder = 'dishes'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/uploads?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new ApiError('network', 'Không kết nối được với máy chủ. Vui lòng thử lại sau ít phút.');
  }
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    data?: { path?: string };
    error?: { code?: string; message?: string };
  } | null;
  if (res.status !== 200 || !json) {
    throw new ApiError('http', 'Hệ thống đang gặp sự cố tạm thời. Vui lòng quay lại sau ít phút.', { status: res.status });
  }
  if (!json.ok) {
    throw new ApiError('business', json.error?.message || 'Tải ảnh không thành công.', { code: json.error?.code });
  }
  return json.data?.path ?? '';
}

export async function removeUploadedImage(path: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/uploads`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  } catch {
    // Dọn ảnh là tối ưu, không bắt buộc — bỏ qua lỗi mạng.
  }
}

function queryString(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  dishes: {
    list: (params: Record<string, string | number | undefined>) =>
      requestList<Dish>(`/api/dishes${queryString(params)}`),
    detail: (id: number) => request<Dish>(`/api/dishes/${id}`),
    create: (body: Record<string, unknown>) => request<Dish>('/api/dishes', { method: 'POST', body }),
    update: (id: number, body: Record<string, unknown>) =>
      request<Dish>(`/api/dishes/${id}`, { method: 'PATCH', body }),
    remove: (id: number) => request<null>(`/api/dishes/${id}`, { method: 'DELETE' }),
  },
  chefs: {
    list: (params: Record<string, string | number | undefined>) =>
      requestList<Chef>(`/api/chefs${queryString(params)}`),
    detail: (id: number) => request<Chef>(`/api/chefs/${id}`),
    create: (body: Record<string, unknown>) => request<Chef>('/api/chefs', { method: 'POST', body }),
    update: (id: number, body: Record<string, unknown>) =>
      request<Chef>(`/api/chefs/${id}`, { method: 'PATCH', body }),
    remove: (id: number) => request<null>(`/api/chefs/${id}`, { method: 'DELETE' }),
  },
  ingredients: {
    list: (params: Record<string, string | number | undefined>) =>
      requestList<Ingredient>(`/api/ingredients${queryString(params)}`),
    detail: (id: number) => request<Ingredient>(`/api/ingredients/${id}`),
    create: (body: Record<string, unknown>) => request<Ingredient>('/api/ingredients', { method: 'POST', body }),
    update: (id: number, body: Record<string, unknown>) =>
      request<Ingredient>(`/api/ingredients/${id}`, { method: 'PATCH', body }),
    remove: (id: number) => request<null>(`/api/ingredients/${id}`, { method: 'DELETE' }),
  },
  uploads: {
    upload: (file: File, folder: UploadFolder = 'dishes') => uploadImage(file, folder),
    remove: (path: string) => removeUploadedImage(path),
  },
};

export type { UploadResult };
