import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.__POINTERSCORE_CONFIG__;

if (!config?.supabaseUrl || !config?.supabasePublishableKey) {
  throw new Error("PointerScore authentication is not configured.");
}

export const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  }
});

export function safeRedirect(fallback = "dashboard.html") {
  const requested = new URLSearchParams(window.location.search).get("redirect");
  if (!requested) return new URL(fallback, window.location.href).href;

  const destination = new URL(requested, window.location.href);
  return destination.origin === window.location.origin
    ? destination.href
    : new URL(fallback, window.location.href).href;
}

export async function getVerifiedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function requireUser() {
  const user = await getVerifiedUser();
  if (user) return user;

  const authUrl = new URL("/auth.html", window.location.origin);
  authUrl.searchParams.set("redirect", window.location.pathname + window.location.search);
  window.location.replace(authUrl.href);
  return null;
}

export function revealProtectedPage() {
  document.body.classList.remove("is-auth-loading");
  document.body.classList.add("is-authenticated");
}
