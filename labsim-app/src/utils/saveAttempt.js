import { supabase, supabaseConfigured } from '../lib/supabaseClient';

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
  }
}
