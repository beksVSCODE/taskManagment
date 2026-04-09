/**
 * JWT Token utilities для проверки валидности и истечения токена
 */

interface JwtPayload {
    sub: string; // email
    role: string;
    exp: number; // expiration timestamp (seconds)
    iat: number; // issued at timestamp (seconds)
}

/**
 * Декодирование JWT токена (без верификации подписи)
 * Используется только для проверки expiration на клиенте
 */
export function decodeJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * Проверка, истёк ли токен
 * @param token JWT токен
 * @param bufferSeconds количество секунд до истечения для превентивного logout (по умолчанию 60)
 * @returns true если токен истёк или истечёт через bufferSeconds секунд
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now < bufferSeconds;
}

/**
 * Получение времени истечения токена
 */
export function getTokenExpiration(token: string): Date | null {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return null;
    return new Date(payload.exp * 1000);
}

/**
 * Получение email из токена
 */
export function getTokenEmail(token: string): string | null {
    const payload = decodeJwt(token);
    return payload?.sub || null;
}

/**
 * Получение роли из токена
 */
export function getTokenRole(token: string): string | null {
    const payload = decodeJwt(token);
    return payload?.role || null;
}
