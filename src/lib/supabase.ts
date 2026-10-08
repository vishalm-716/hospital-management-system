import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using service role key.
 * 
 * IMPORTANT: The service-role key bypasses Storage RLS (Row Level Security).
 * This key must NEVER be exposed to the client/browser.
 * It should only be used in server actions, API routes, and server components.
 * 
 * For file uploads, the service-role key allows direct upload without
 * needing to configure Storage policies, since it has full admin access.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Upload a file to the private medical-reports bucket.
 * Uses service-role key to bypass RLS - server-only.
 */
export async function uploadMedicalReport(
  filePath: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ path: string; error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    const bucket = process.env.SUPABASE_BUCKET || "medical-reports";

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      return { path: "", error: error.message };
    }

    return { path: data.path, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { path: "", error: message };
  }
}

/**
 * Generate a short-lived signed URL for downloading a medical report.
 * Must verify user authorization BEFORE calling this function.
 */
export async function getSignedReportUrl(
  storagePath: string,
  expiresInSeconds: number = 300 // 5 minutes
): Promise<{ url: string; error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    const bucket = process.env.SUPABASE_BUCKET || "medical-reports";

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      return { url: "", error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate URL";
    return { url: "", error: message };
  }
}
