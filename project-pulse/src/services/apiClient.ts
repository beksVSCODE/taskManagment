import { config } from '@/config';

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('jwt_token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Для эндпоинта логина 401 = неверный пароль, не выгоняем пользователя
        if (!endpoint.includes('/auth/login')) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('current_user');
            window.dispatchEvent(new Event('auth:logout'));
        }
        const body = await response.json().catch(() => null);
        const message = (body as Record<string, string>)?.message
            || (body as Record<string, string>)?.error
            || 'Неверный email или пароль';
        throw new ApiError(401, message);
    }

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return undefined as T;
    }

    const contentType = response.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
        const body = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');
        let message = `Ошибка ${response.status}`;
        if (typeof body === 'object' && body !== null) {
            const b = body as Record<string, string>;
            // При 500 показываем detail (реальная причина) если есть
            if (response.status >= 500 && b.detail) {
                message = b.detail;
            } else {
                message = b.message || b.error || b.detail || message;
            }
        } else if (typeof body === 'string' && body.trim()) {
            message = body;
        }
        throw new ApiError(response.status, message);
    }

    return isJson ? response.json() : (response.text() as unknown as T);
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

    post: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

    patch: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

    put: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

    postForm: <T>(endpoint: string, formData: FormData) => {
        const token = localStorage.getItem('jwt_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return request<T>(endpoint, { method: 'POST', headers, body: formData });
    },
};
