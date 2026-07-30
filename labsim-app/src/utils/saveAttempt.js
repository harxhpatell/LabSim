import { supabase, supabaseConfigured } from '../lib/supabaseClient';

/**
 * Saves one experiment attempt for the current user, if logged in.
 * Silently does nothing if Supabase isn't configured or nobody is signed in —
 * the app works fully without an account, this just adds history for those who sign up.
 */
export async function saveAttempt({ userId, experiment, code, resultData, vivaScore = null }) {
  if (!supabaseConfigured || !userId) return;
  try {
    await supabase.from('attempts').insert({
      user_id: userId,
      experiment,
      code,
      result_data: resultData,
      viva_score: vivaScore?.score ?? null,
      viva_total: vivaScore?.total ?? null,
    });
  } catch {
    // Non-fatal — the experiment still works, we just couldn't log history this time.
  }
}
