import { describe, it, expect } from 'vitest';
import { decodeJwt, isTokenExpired, getTokenEmail, getTokenRole } from '../lib/jwt';

// Тестовый JWT токен (выпущен для тестов, истекает в 2030 году)
const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiZXhwIjoxODkzNDU2MDAwLCJpYXQiOjE3MDAwMDAwMDB9.fake_signature';
const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNTAwMDAwMDAwLCJpYXQiOjE0MDAwMDAwMDB9.fake_signature';

describe('JWT utilities', () => {
    describe('decodeJwt', () => {
        it('should decode valid JWT token', () => {
            const payload = decodeJwt(VALID_TOKEN);
            expect(payload).toBeTruthy();
            expect(payload?.sub).toBe('test@example.com');
            expect(payload?.role).toBe('ADMIN');
        });

        it('should return null for invalid token', () => {
            expect(decodeJwt('invalid')).toBeNull();
            expect(decodeJwt('')).toBeNull();
            expect(decodeJwt('a.b')).toBeNull();
        });
    });

    describe('isTokenExpired', () => {
        it('should return false for valid token', () => {
            expect(isTokenExpired(VALID_TOKEN)).toBe(false);
        });

        it('should return true for expired token', () => {
            expect(isTokenExpired(EXPIRED_TOKEN)).toBe(true);
        });

        it('should return true for invalid token', () => {
            expect(isTokenExpired('invalid')).toBe(true);
        });
    });

    describe('getTokenEmail', () => {
        it('should extract email from token', () => {
            expect(getTokenEmail(VALID_TOKEN)).toBe('test@example.com');
        });

        it('should return null for invalid token', () => {
            expect(getTokenEmail('invalid')).toBeNull();
        });
    });

    describe('getTokenRole', () => {
        it('should extract role from token', () => {
            expect(getTokenRole(VALID_TOKEN)).toBe('ADMIN');
        });

        it('should return null for invalid token', () => {
            expect(getTokenRole('invalid')).toBeNull();
        });
    });
});
