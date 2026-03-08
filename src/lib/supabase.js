import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://iwnlsjaayljcohbrbqkt.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bmxzamFheWxqY29oYnJicWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTYxMDIsImV4cCI6MjA4NjEzMjEwMn0.VFkTZ0WhHAqvJwHookoxMPfY63sxjD4P-gLZ1lHausU";

export const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
export const KEEP_SIGNED_IN_KEY = "keep-signed-in";
export const LAST_AUTH_USER_KEY = "last-auth-user";
const SUPABASE_PROJECT_REF = (() => {
    try {
        return new URL(SUPABASE_URL).hostname.split('.')[0];
    } catch (_e) {
        return '';
    }
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

// =============================================
// Profile Functions
// =============================================

/**
 * Get the current user's profile from the database
 */
export async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Check whether the current signed-in user is an admin.
 * Uses `is_admin()` when available and falls back to `app_admins`.
 */
export async function isCurrentUserAdmin() {
    const user = await getCurrentUser();
    if (!user?.id) return false;

    try {
        const { data, error } = await supabase.rpc('is_admin', { check_user: user.id });
        if (!error && typeof data === 'boolean') return data;
    } catch (_e) {
        // fall back to direct lookup
    }

    try {
        const { data, error } = await supabase
            .from('app_admins')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) return false;
        return Boolean(data?.user_id);
    } catch (_e) {
        return false;
    }
}

export async function getAdminSystemData(options = {}) {
    const {
        profilesLimit = 500,
        notesLimit = 500,
        usageLimit = 500,
    } = options;

    const admin = await isCurrentUserAdmin();
    if (!admin) throw new Error('Admin access required');

    const [
        profilesRes,
        notesRes,
        usageRes,
        profileCountRes,
        noteCountRes,
        usageCountRes,
    ] = await Promise.all([
        supabase
            .from('student_profiles')
            .select('id, email, first_name, last_name, full_name, student_id, grade_level, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(profilesLimit),
        supabase
            .from('notes')
            .select('id, user_id, title, subject, content, explanation, file_url, created_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(notesLimit),
        supabase
            .from('ai_token_usage')
            .select('id, user_id, model, generate_type, prompt_tokens, completion_tokens, total_tokens, created_at')
            .order('created_at', { ascending: false })
            .limit(usageLimit),
        supabase
            .from('student_profiles')
            .select('id', { count: 'exact', head: true }),
        supabase
            .from('notes')
            .select('id', { count: 'exact', head: true }),
        supabase
            .from('ai_token_usage')
            .select('id', { count: 'exact', head: true }),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (notesRes.error) throw notesRes.error;
    if (usageRes.error) throw usageRes.error;
    if (profileCountRes.error) throw profileCountRes.error;
    if (noteCountRes.error) throw noteCountRes.error;
    if (usageCountRes.error) throw usageCountRes.error;

    const profiles = profilesRes.data || [];
    const notes = notesRes.data || [];
    const aiUsage = usageRes.data || [];

    const activeUsers = new Set([
        ...notes.map((row) => row.user_id),
        ...aiUsage.map((row) => row.user_id),
    ].filter(Boolean));

    const totalTokens = aiUsage.reduce((sum, row) => {
        const value = Number(row?.total_tokens || 0);
        return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    return {
        metrics: {
            totalProfiles: profileCountRes.count || 0,
            totalNotes: noteCountRes.count || 0,
            totalAiUsageRows: usageCountRes.count || 0,
            activeUsers: activeUsers.size,
            sampledTokens: totalTokens,
        },
        profiles,
        notes,
        aiUsage,
        limits: {
            profilesLimit,
            notesLimit,
            usageLimit,
        },
        fetchedAt: new Date().toISOString(),
    };
}

// =============================================
// Notes Functions
// =============================================

const NOTES_CACHE_PREFIX = 'notes-cache:';
const NOTES_QUEUE_PREFIX = 'notes-queue:';
const LOCAL_NOTE_PREFIX = 'local-note-';
const AI_USAGE_CACHE_PREFIX = 'ai-usage-cache:';
const OFFLINE_READY_PREFIX = 'offline-ready:';
let notesSyncInFlight = null;

export function isKeepSignedInEnabled() {
    return localStorage.getItem(KEEP_SIGNED_IN_KEY) !== "false";
}

export function readCachedAuthUser() {
    try {
        const raw = localStorage.getItem(LAST_AUTH_USER_KEY);
        if (raw) {
            const cached = JSON.parse(raw);
            if (cached?.id) return { id: cached.id, email: cached.email || null };
        }
    } catch (_e) {
        // ignore malformed cache
    }

    return readSupabaseStoredUser();
}

export function clearAuthLocalCache() {
    try {
        localStorage.removeItem(LAST_AUTH_USER_KEY);
    } catch (_e) {
        // ignore
    }
}

export function cacheAuthUser(user) {
    if (!user?.id) return;
    try {
        localStorage.setItem(LAST_AUTH_USER_KEY, JSON.stringify({
            id: user.id,
            email: user.email || null,
        }));
    } catch (_e) {
        // ignore localStorage write errors
    }
}

function isOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function cacheKey(userId) {
    return `${NOTES_CACHE_PREFIX}${userId}`;
}

function queueKey(userId) {
    return `${NOTES_QUEUE_PREFIX}${userId}`;
}

function aiUsageKey(userId) {
    return `${AI_USAGE_CACHE_PREFIX}${userId}`;
}

function offlineReadyKey(userId) {
    return `${OFFLINE_READY_PREFIX}${userId}`;
}

function readJSON(key, fallback = []) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : fallback;
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
        console.error('Failed reading local storage key:', key, err);
        return fallback;
    }
}

function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.error('Failed writing local storage key:', key, err);
    }
}

function sortNotes(notes) {
    return [...(notes || [])].sort((a, b) => {
        const aTime = Date.parse(a?.updated_at || a?.created_at || 0) || 0;
        const bTime = Date.parse(b?.updated_at || b?.created_at || 0) || 0;
        return bTime - aTime;
    });
}

function readCache(userId) {
    return readJSON(cacheKey(userId), []);
}

function writeCache(userId, notes) {
    writeJSON(cacheKey(userId), sortNotes(notes));
}

function readQueue(userId) {
    return readJSON(queueKey(userId), []);
}

function writeQueue(userId, queue) {
    writeJSON(queueKey(userId), queue);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notes-sync-updated', {
            detail: { userId, pending: Array.isArray(queue) ? queue.length : 0 }
        }));
    }
}

function upsertCache(userId, note) {
    const existing = readCache(userId);
    const idx = existing.findIndex((n) => String(n.id) === String(note.id));
    if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...note };
    } else {
        existing.unshift(note);
    }
    writeCache(userId, existing);
}

function removeCacheNote(userId, id) {
    const existing = readCache(userId).filter((n) => String(n.id) !== String(id));
    writeCache(userId, existing);
}

function replaceCacheId(userId, oldId, newNote) {
    const existing = readCache(userId).map((n) => {
        if (String(n.id) !== String(oldId)) return n;
        return { ...n, ...newNote, id: newNote.id, _local: false };
    });
    writeCache(userId, existing);
}

function queueOperation(userId, op) {
    const queue = readQueue(userId);
    queue.push(op);
    writeQueue(userId, queue);
}

function markCacheFromQueue(remoteNotes, queue, cachedNotes) {
    const byId = new Map((remoteNotes || []).map((n) => [String(n.id), { ...n }]));
    const cachedById = new Map((cachedNotes || []).map((n) => [String(n.id), { ...n }]));

    for (const op of queue) {
        if (op.type === 'create') {
            const temp = cachedById.get(String(op.temp_id));
            if (temp) byId.set(String(op.temp_id), temp);
            continue;
        }
        if (op.type === 'update') {
            const id = String(op.id);
            const current = byId.get(id);
            if (current) byId.set(id, { ...current, ...op.updates, _local: true });
            continue;
        }
        if (op.type === 'delete') {
            byId.delete(String(op.id));
        }
    }

    return sortNotes(Array.from(byId.values()));
}

function isNetworkLikeError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
        message.includes('failed to fetch')
        || message.includes('network')
        || message.includes('fetch failed')
        || message.includes('offline')
    );
}

async function getCurrentUser() {
    // Prefer session-first so offline mode can still resolve the signed-in user.
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
            cacheAuthUser(sessionData.session.user);
            return sessionData.session.user;
        }
    } catch (_e) {
        // Continue to fallbacks below.
    }

    // Fallback to network-backed user lookup when online.
    if (isOnline()) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                cacheAuthUser(user);
                return user;
            }
        } catch (_e) {
            // Continue to cached user fallback.
        }
    }

    // Final fallback: cached user ID for offline queueing.
    const cachedUser = readCachedAuthUser();
    if (cachedUser?.id) return cachedUser;

    return null;
}

function collapseQueueForLocalCreate(userId, localId, updates) {
    const queue = readQueue(userId);
    const createOp = queue.find((op) => op.type === 'create' && String(op.temp_id) === String(localId));
    if (createOp) {
        createOp.payload = { ...createOp.payload, ...updates };
        writeQueue(userId, queue);
        return true;
    }
    return false;
}

function readSupabaseStoredUser() {
    if (!SUPABASE_PROJECT_REF) return null;
    const toCachedUser = (user) => {
        if (user?.id) return { id: user.id, email: user.email || null };
        return null;
    };
    const extractUserFromTokenPayload = (payload) => {
        if (!payload) return null;
        const directCandidates = [
            payload.user,
            payload.currentSession?.user,
            payload.session?.user,
            payload.data?.session?.user,
        ];

        for (const candidate of directCandidates) {
            const mapped = toCachedUser(candidate);
            if (mapped) return mapped;
        }

        // Support token payloads saved as arrays by some auth client versions.
        if (Array.isArray(payload)) {
            for (const item of payload) {
                const nested = extractUserFromTokenPayload(item);
                if (nested) return nested;
            }
        }

        return null;
    };

    try {
        const tokenKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
        const raw = localStorage.getItem(tokenKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return extractUserFromTokenPayload(parsed);
    } catch (_e) {
        // ignore malformed token storage
    }
    return null;
}

export async function getNotesSyncStatus() {
    const user = await getCurrentUser();
    if (!user) return { online: isOnline(), pending: 0 };
    const pending = readQueue(user.id).length;
    return { online: isOnline(), pending };
}

export async function getAiTokenUsageStatus(windowHours = 24, limit = 50_000) {
    const user = await getCurrentUser();
    if (!user?.id) {
        return { used: 0, remaining: limit, limit, windowHours, available: false, offline: !isOnline() };
    }

    const cacheKeyUsage = aiUsageKey(user.id);
    const readCached = () => {
        try {
            const raw = localStorage.getItem(cacheKeyUsage);
            return raw ? JSON.parse(raw) : null;
        } catch (_e) {
            return null;
        }
    };

    if (!isOnline()) {
        const cached = readCached();
        if (cached) return { ...cached, offline: true };
        return { used: 0, remaining: limit, limit, windowHours, available: false, offline: true };
    }

    try {
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('ai_token_usage')
            .select('total_tokens')
            .eq('user_id', user.id)
            .gte('created_at', since);

        if (error) throw error;

        const used = (data || []).reduce((sum, row) => {
            const value = Number(row?.total_tokens || 0);
            return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        const payload = {
            used,
            remaining: Math.max(0, limit - used),
            limit,
            windowHours,
            available: true,
            offline: false,
            updatedAt: new Date().toISOString(),
        };

        try {
            localStorage.setItem(cacheKeyUsage, JSON.stringify(payload));
        } catch (_e) {
            // ignore cache write errors
        }

        return payload;
    } catch (_error) {
        const cached = readCached();
        if (cached) return { ...cached, offline: !isOnline() };
        return { used: 0, remaining: limit, limit, windowHours, available: false, offline: !isOnline() };
    }
}

export async function syncNotesQueue() {
    if (notesSyncInFlight) {
        return notesSyncInFlight;
    }

    notesSyncInFlight = (async () => {
    const user = await getCurrentUser();
    if (!user || !isOnline()) return;

    const userId = user.id;
    const queue = readQueue(userId);
    if (!queue.length) return;

    const remaining = [];
    const idMap = new Map();

    for (const originalOp of queue) {
        const op = { ...originalOp };
        if (op.id && idMap.has(String(op.id))) {
            op.id = idMap.get(String(op.id));
        }
        try {
            if (op.type === 'create') {
                const { data, error } = await supabase
                    .from('notes')
                    .insert({ ...op.payload, user_id: userId })
                    .select()
                    .single();
                if (error) throw error;
                idMap.set(String(op.temp_id), data.id);
                replaceCacheId(userId, op.temp_id, data);
                continue;
            }

            if (op.type === 'update') {
                const targetId = idMap.get(String(op.id)) || op.id;
                if (String(targetId).startsWith(LOCAL_NOTE_PREFIX)) {
                    remaining.push({ ...op, id: targetId });
                    continue;
                }
                const { data, error } = await supabase
                    .from('notes')
                    .update(op.updates)
                    .eq('id', targetId)
                    .select()
                    .single();
                if (error) throw error;
                upsertCache(userId, { ...data, _local: false });
                continue;
            }

            if (op.type === 'delete') {
                const targetId = idMap.get(String(op.id)) || op.id;
                if (String(targetId).startsWith(LOCAL_NOTE_PREFIX)) {
                    removeCacheNote(userId, targetId);
                    continue;
                }
                const { error } = await supabase
                    .from('notes')
                    .delete()
                    .eq('id', targetId);
                if (error) throw error;
                removeCacheNote(userId, targetId);
            }
        } catch (err) {
            remaining.push(op);
        }
    }

    writeQueue(userId, remaining);
    })();

    try {
        return await notesSyncInFlight;
    } finally {
        notesSyncInFlight = null;
    }
}

if (typeof window !== 'undefined') {
    const trySyncQueue = () => {
        syncNotesQueue().catch((err) => console.error('Queue sync failed:', err));
    };

    window.addEventListener('online', trySyncQueue);
    window.addEventListener('focus', () => {
        if (isOnline()) trySyncQueue();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isOnline()) {
            trySyncQueue();
        }
    });

    if (isOnline()) {
        setTimeout(trySyncQueue, 0);
    }
}

/**
 * Get all notes for the current user
 */
/**
 * Get notes. By default returns only notes for the signed-in user.
 * If `all` is true, fetches all rows from the `notes` table.
 */
export async function getNotes(all = false) {
    if (all) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes (all):', error);
            return [];
        }
        return data;
    }

    const user = await getCurrentUser();
    if (!user) return [];

    const cached = readCache(user.id);

    if (!isOnline()) {
        return sortNotes(cached);
    }

    try {
        await syncNotesQueue();
        const queue = readQueue(user.id);
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const merged = markCacheFromQueue(data || [], queue, cached);
        writeCache(user.id, merged);
        return merged;
    } catch (error) {
        console.error('Error fetching notes, using cache:', error);
        return sortNotes(cached);
    }
}

/**
 * Create a new note
 */
export async function createNote(note) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    const payload = { ...note, user_id: user.id };

    if (isOnline()) {
        try {
            await syncNotesQueue();
            const { data, error } = await supabase
                .from('notes')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            upsertCache(user.id, { ...data, _local: false });
            return data;
        } catch (error) {
            if (!isNetworkLikeError(error)) throw error;
        }
    }

    const tempId = `${LOCAL_NOTE_PREFIX}${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const localNote = {
        ...payload,
        id: tempId,
        created_at: now,
        updated_at: now,
        _local: true
    };
    upsertCache(user.id, localNote);
    queueOperation(user.id, { type: 'create', temp_id: tempId, payload: note, created_at: now });
    return localNote;
}

/**
 * Update a note
 */
export async function updateNote(id, updates) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const patched = { ...updates, updated_at: new Date().toISOString(), _local: true };
    upsertCache(user.id, { id, ...patched });

    const isLocalId = String(id).startsWith(LOCAL_NOTE_PREFIX);
    if (isLocalId && collapseQueueForLocalCreate(user.id, id, updates)) {
        return { id, ...patched };
    }

    if (isOnline() && !isLocalId) {
        try {
            await syncNotesQueue();
            const { data, error } = await supabase
                .from('notes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            upsertCache(user.id, { ...data, _local: false });
            return data;
        } catch (error) {
            if (!isNetworkLikeError(error)) throw error;
        }
    }

    queueOperation(user.id, { type: 'update', id, updates });
    return { id, ...patched };
}

/**
 * Delete a note
 */
export async function deleteNote(id) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    removeCacheNote(user.id, id);

    // Remove any pending create/update for local note before queuing delete.
    const queue = readQueue(user.id).filter((op) => {
        if (String(id).startsWith(LOCAL_NOTE_PREFIX)) {
            return !(String(op?.temp_id) === String(id) || String(op?.id) === String(id));
        }
        return true;
    });
    writeQueue(user.id, queue);

    if (isOnline() && !String(id).startsWith(LOCAL_NOTE_PREFIX)) {
        try {
            await syncNotesQueue();
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return;
        } catch (error) {
            if (!isNetworkLikeError(error)) throw error;
        }
    }

    if (!String(id).startsWith(LOCAL_NOTE_PREFIX)) {
        queueOperation(user.id, { type: 'delete', id });
    }
}

export async function warmOfflineReadiness() {
    const user = await getCurrentUser();
    if (!user?.id) return;

    // Keep a stable local identity for offline auth guards.
    cacheAuthUser(user);

    // Only warm network resources when online.
    if (!isOnline()) return;

    const appShellUrls = [
        '/',
        '/dashboard',
        '/notes',
        '/add-note',
        '/ai-helper',
        '/about',
        '/login',
        '/register',
        '/index.html',
    ];

    const warmAppShell = async () => {
        if (typeof window === 'undefined' || !('caches' in window)) return;
        const cache = await caches.open('note-explainer-runtime');
        await Promise.allSettled(
            appShellUrls.map(async (url) => {
                const response = await fetch(url, { cache: 'no-store' });
                if (response.ok) {
                    await cache.put(url, response.clone());
                }
            })
        );
    };

    await Promise.allSettled([
        getNotes(),
        getProfile(),
        warmAppShell(),
        getAiTokenUsageStatus(24, 50_000),
    ]);

    try {
        localStorage.setItem(offlineReadyKey(user.id), JSON.stringify({
            ready: true,
            updatedAt: new Date().toISOString(),
        }));
    } catch (_e) {
        // ignore localStorage write errors
    }
}

export async function isOfflineDataPrimed() {
    const user = await getCurrentUser();
    if (!user?.id) return false;
    try {
        const raw = localStorage.getItem(offlineReadyKey(user.id));
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return parsed?.ready === true;
    } catch (_e) {
        return false;
    }
}
