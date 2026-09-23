import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');

const { parseAuthLinkType } = await import('./supabase');

describe('parseAuthLinkType', () => {
    it('detects an invite link (token in the URL fragment)', () => {
        expect(parseAuthLinkType({ hash: '#access_token=abc&type=invite', search: '' })).toBe('invite');
    });

    it('detects a password recovery link', () => {
        expect(parseAuthLinkType({ hash: '#access_token=abc&type=recovery', search: '' })).toBe('recovery');
    });

    it('ignores ordinary visits and other link types', () => {
        expect(parseAuthLinkType({ hash: '', search: '' })).toBeNull();
        expect(parseAuthLinkType({ hash: '#access_token=abc&type=signup', search: '' })).toBeNull();
        expect(parseAuthLinkType({ hash: '', search: '?foo=bar' })).toBeNull();
    });
});
