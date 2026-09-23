import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type AuthLinkType = 'invite' | 'recovery' | null;

/** Reads the link type from the URL the user arrived on. */
export function parseAuthLinkType(url: { hash: string; search: string }): AuthLinkType {
    const params = new URLSearchParams(url.hash.replace(/^#/, '') + '&' + url.search.replace(/^\?/, ''));
    const type = params.get('type');
    return type === 'invite' || type === 'recovery' ? type : null;
}

// Captured before the client is created: supabase-js consumes and clears the
// #access_token=…&type=invite fragment while establishing the session, and
// the app needs to know afterwards that this visit came from an invite or a
// password-recovery email (so it can ask for a password).
export const initialAuthLinkType: AuthLinkType =
    typeof window !== 'undefined' ? parseAuthLinkType(window.location) : null;

export const supabase = createClient(supabaseUrl, supabaseKey);
