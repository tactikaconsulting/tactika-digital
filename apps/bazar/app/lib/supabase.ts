import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || !isValidSupabaseUrl(url)) {
    return null;
  }

  return createClient(url, anonKey);
}

export function isSupabaseConfigured() {
  const status = getSupabaseStatus();

  return status.ready;
}

export function getSupabaseStatus() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const host = getSupabaseHost(url);

  if (!url || !anonKey) {
    return {
      ready: false,
      host: "sin configurar",
      message: "Faltan variables de Supabase en Vercel.",
    };
  }

  if (!isValidSupabaseUrl(url)) {
    return {
      ready: false,
      host: host ?? "URL invalida",
      message: "La URL de Supabase no parece valida.",
    };
  }

  return {
    ready: true,
    host: host ?? url,
    message: "Supabase configurado: ingreso real activo.",
  };
}

function normalizeSupabaseUrl(url?: string) {
  return url?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function isValidSupabaseUrl(url: string) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && !url.toLowerCase().includes("abcde");
}

function getSupabaseHost(url?: string) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
