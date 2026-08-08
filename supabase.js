/**
 * supabase.js
 * ------------------------------------------------------------
 * Supabase client initialization and all database access
 * functions for the Regex Challenge Game.
 *
 * IMPORTANT: Replace SUPABASE_URL and SUPABASE_ANON_KEY below
 * with your own project credentials (Supabase Dashboard ->
 * Project Settings -> API).
 * ------------------------------------------------------------
 */

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------
const SUPABASE_URL = 'https://bzkvslezqechttovajrc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2vHc6N6HaaOzsdvJ5c-XMQ_DYGC5MzH';

// The Supabase JS SDK is loaded globally via CDN in index.html
// (window.supabase). We create a single shared client instance.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch all categories, ordered by their unlock sequence.
 * @returns {Promise<Array>}
 */
async function fetchCategories() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Unable to load categories. Please check your Supabase connection.');
  }
  return data;
}

/**
 * Fetch all challenges belonging to a given category.
 * @param {number} categoryId
 * @returns {Promise<Array>}
 */
async function fetchChallengesByCategory(categoryId) {
  const { data, error } = await supabaseClient
    .from('regex_challenges')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching challenges:', error);
    throw new Error('Unable to load challenges. Please check your Supabase connection.');
  }
  return data;
}

/**
 * Fetch every challenge across every category in a single call
 * (used to preload the whole game up front).
 * @returns {Promise<Array>}
 */
async function fetchAllChallenges() {
  const { data, error } = await supabaseClient
    .from('regex_challenges')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching all challenges:', error);
    throw new Error('Unable to load challenges. Please check your Supabase connection.');
  }
  return data;
}

/**
 * Save a (partial or final) game result to the leaderboard. Scores are
 * TALLIED per username: the score delta passed in is ADDED on top of
 * their running total via the `upsert_leaderboard_score` Postgres
 * function (see database.sql), so this is safe to call multiple times
 * per playthrough (e.g. once per completed category) as long as only
 * the newly-earned points since the last sync are passed in.
 * @param {{username: string, score: number, accuracy: number, completionTime: number, countGame?: boolean}} entry
 * @returns {Promise<Object>}
 */
async function saveLeaderboardEntry(entry) {
  const { data, error } = await supabaseClient.rpc('upsert_leaderboard_score', {
    p_username: entry.username,
    p_score_delta: entry.score,
    p_accuracy: entry.accuracy,
    p_completion_time: entry.completionTime,
    p_count_game: entry.countGame !== false
  });

  if (error) {
    console.error('Error saving leaderboard entry:', error);
    throw new Error('Unable to save your score. Please check your Supabase connection.');
  }
  return data;
}

/**
 * Check whether a username already exists in the leaderboard table.
 * Used on the main dashboard so returning players are recognized
 * and their tallied score keeps accumulating under the same row.
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
async function fetchLeaderboardEntryByUsername(username) {
  const { data, error } = await supabaseClient
    .from('leaderboard')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    throw new Error('Unable to verify your username. Please check your Supabase connection.');
  }
  return data;
}

/**
 * Fetch the top 10 leaderboard entries, sorted by score desc.
 * @returns {Promise<Array>}
 */
async function fetchTopLeaderboard() {
  const { data, error } = await supabaseClient
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error('Unable to load the leaderboard. Please check your Supabase connection.');
  }
  return data;
}
