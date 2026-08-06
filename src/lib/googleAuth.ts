import supabase from './supabase';

/**
 * Starts Google OAuth through Supabase.
 * Google credentials are configured in Supabase Dashboard, so the browser
 * does not need a Google client ID or a Design Arena auth-proxy URL.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error('[google-auth] Failed to start Google sign-in:', error.message);
  }
}
