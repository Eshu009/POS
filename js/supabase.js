// ============================================
// POS-Shop — Supabase Client Singleton
// ============================================

import Config from './config.js';

let supabaseClient = null;

/**
 * Initialize and return the Supabase client singleton.
 * Uses the Supabase JS CDN (loaded in index.html).
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS library not loaded. Make sure the CDN script is in index.html.');
    return null;
  }

  supabaseClient = window.supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

/**
 * Wrapper for Supabase queries with error handling.
 * @param {Promise} queryPromise - A Supabase query promise
 * @returns {Promise<{data: any, error: any}>}
 */
export async function query(queryPromise) {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.error('Supabase query error:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Supabase query exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Invoke a Supabase Edge Function.
 * @param {string} functionName
 * @param {object} body
 * @returns {Promise<{data: any, error: any}>}
 */
export async function invokeFunction(functionName, body = {}) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: new Error('Supabase not initialized') };

  try {
    const { data, error } = await sb.functions.invoke(functionName, {
      body: JSON.stringify(body),
    });
    if (error) {
      console.error(`Edge Function "${functionName}" error:`, error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error(`Edge Function "${functionName}" exception:`, err);
    return { data: null, error: err };
  }
}

/**
 * Upload a file to Supabase Storage.
 * @param {string} bucket
 * @param {string} path
 * @param {File} file
 * @returns {Promise<{url: string|null, error: any}>}
 */
export async function uploadFile(bucket, path, file) {
  const sb = getSupabase();
  if (!sb) return { url: null, error: new Error('Supabase not initialized') };

  const { data, error } = await sb.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Storage upload error:', error);
    return { url: null, error };
  }

  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(data.path);
  return { url: urlData.publicUrl, error: null };
}

/**
 * Delete a file from Supabase Storage.
 * @param {string} bucket
 * @param {string[]} paths
 */
export async function deleteFiles(bucket, paths) {
  const sb = getSupabase();
  if (!sb) return { error: new Error('Supabase not initialized') };

  const { error } = await sb.storage.from(bucket).remove(paths);
  if (error) console.error('Storage delete error:', error);
  return { error };
}

export default { getSupabase, query, invokeFunction, uploadFile, deleteFiles };
