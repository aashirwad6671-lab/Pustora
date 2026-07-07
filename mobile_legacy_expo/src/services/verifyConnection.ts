import { supabase } from './supabaseClient';

/**
 * Diagnostics utility to verify database connectivity.
 * Evaluates credentials and public schema access states.
 */
export async function verifySupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Attempt to query a single record from the public profiles schema
    const { error, status } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (error) {
      // 401 Unauthorized or 403 Forbidden indicates the URL is active, but key is a placeholder
      if (status === 401 || status === 403) {
        return {
          success: false,
          message: `Endpoint active, but credentials rejected. Please replace "your-supabase-anon-key-placeholder" with your actual publishable anon key in the mobile/.env file. Error details: ${error.message}`
        };
      }
      return {
        success: false,
        message: `Supabase query rejected: ${error.message} (HTTP Status ${status})`
      };
    }
    
    return {
      success: true,
      message: 'Supabase database connection established successfully. Live profiles schema synced.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Supabase network transport failed: ${err.message || 'Unknown network error'}`
    };
  }
}
