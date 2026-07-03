import { supabase } from "./auth-client.js";

const CACHE_PREFIX = "pointerscore-analyses:";
const LEGACY_STORAGE_KEY = "pointerscore-analyses";
const MIGRATION_PREFIX = "pointerscore-cloud-migrated:";

function cacheKey(userId) {
  return `${CACHE_PREFIX}${userId}`;
}

export function readAnalysisCache(userId) {
  try {
    const value = JSON.parse(localStorage.getItem(cacheKey(userId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeAnalysisCache(userId, analyses) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(analyses));
  } catch {
    // The cloud remains the source of truth when browser storage is unavailable.
  }
}

export function saveAnalysisCache(userId, analysis) {
  const now = new Date().toISOString();
  const cached = { ...analysis, createdAt: analysis.createdAt || now, updatedAt: now };
  cacheOne(userId, cached);
  return cached;
}

function fromRow(row) {
  const payload = row.data && typeof row.data === "object" ? row.data : {};
  return {
    id: row.id,
    company: row.company_name,
    score: Number(row.score),
    notes: String(payload.notes || ""),
    input: payload.input || {},
    result: payload.result || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function cacheOne(userId, analysis) {
  const cached = readAnalysisCache(userId);
  const next = cached.some((item) => item.id === analysis.id)
    ? cached.map((item) => item.id === analysis.id ? analysis : item)
    : [...cached, analysis];
  writeAnalysisCache(userId, next);
}

export async function listAnalyses(userId) {
  await migrateLegacyAnalyses(userId);
  const { data, error } = await supabase
    .from("analyses")
    .select("id,user_id,company_name,score,data,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const analyses = (data || []).map(fromRow);
  writeAnalysisCache(userId, analyses);
  return analyses;
}

export async function getAnalysis(userId, analysisId) {
  await migrateLegacyAnalyses(userId);
  const { data, error } = await supabase
    .from("analyses")
    .select("id,user_id,company_name,score,data,created_at,updated_at")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const analysis = fromRow(data);
  cacheOne(userId, analysis);
  return analysis;
}

export async function saveAnalysis(userId, analysis) {
  const now = new Date().toISOString();
  const row = {
    id: analysis.id || crypto.randomUUID(),
    user_id: userId,
    company_name: analysis.company,
    score: analysis.score,
    data: {
      notes: String(analysis.notes || ""),
      input: analysis.input || {},
      result: analysis.result || null
    },
    created_at: analysis.createdAt || now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from("analyses")
    .upsert(row, { onConflict: "id" })
    .select("id,user_id,company_name,score,data,created_at,updated_at")
    .single();

  if (error) throw error;
  const saved = fromRow(data);
  cacheOne(userId, saved);
  return saved;
}

async function migrateLegacyAnalyses(userId) {
  if (localStorage.getItem(`${MIGRATION_PREFIX}${userId}`) === "1") return;
  let legacy = [];
  try {
    const value = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
    legacy = Array.isArray(value) ? value : [];
  } catch {
    legacy = [];
  }

  for (const analysis of legacy) {
    if (!analysis?.id || !analysis?.company) continue;
    await saveAnalysis(userId, analysis);
  }
  try {
    localStorage.setItem(`${MIGRATION_PREFIX}${userId}`, "1");
  } catch {
    // A blocked browser cache must not prevent cloud storage from working.
  }
}

export async function deleteAnalysis(userId, analysisId) {
  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("user_id", userId)
    .eq("id", analysisId);

  if (error) throw error;
  writeAnalysisCache(userId, readAnalysisCache(userId).filter((item) => item.id !== analysisId));
}

export function friendlyAnalysisError(error, fallback) {
  console.error("PointerScore analysis storage error:", error);
  return fallback;
}
