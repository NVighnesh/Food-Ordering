import axios from "axios"

export const API_URL="http://localhost:5454"

export const api=axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Attach JWT from localStorage to every request if present.
api.interceptors.request.use((config) => {
    try {
        let token = localStorage.getItem('jwt');
        if (token) {
            // token might be stored as a JSON string (e.g. { token: '...' })
            if (typeof token === 'string' && token.startsWith('{')) {
                try {
                    const parsed = JSON.parse(token);
                    // common fields
                    token = parsed.token || parsed.accessToken || parsed.jwt || token;
                } catch (e) {
                    // leave token as-is
                }
            }
            // token may already include 'Bearer ' prefix; ensure we don't double-prefix
            config.headers = config.headers || {};
            const headerValue = (typeof token === 'string' && token.startsWith('Bearer ')) ? token : `Bearer ${token}`;
            config.headers.Authorization = headerValue;
            // lightweight debug for requests to notifications endpoint
            // avoid noisy per-request debug logs in production; keep for dev only
            // no-op: removed verbose request debug to avoid console noise in UI
        }
    } catch (e) {
        // ignore localStorage errors
    }
    return config;
}, (error) => Promise.reject(error));

// Log response errors to make debugging easier
api.interceptors.response.use((res) => res, (error) => {
    try {
        const status = error?.response?.status;
        const url = error?.config?.url;
        // Avoid noisy console warnings for auth errors (401/403). Warn for server (5xx) errors.
        if (status >= 500) {
            console.warn(`api error [${status}] ${url}`, error?.response?.data || error.message || error);
        } else if (status === 401 || status === 403) {
            // auth errors handled upstream; keep silent here
        } else {
            // non-fatal warnings are useful in development
            if (process.env.NODE_ENV !== 'production') console.warn(`api error [${status}] ${url}`, error?.response?.data || error.message || error);
        }
    } catch (e) { /* ignore */ }
    return Promise.reject(error);
});

// Toggle notifications feature (set to false to avoid calling /api/users/notifications)
// Set to true when your backend implements the notifications endpoints.
export const NOTIFICATIONS_ENABLED = true;

// Notifications API helpers (minimal wrappers around backend endpoints)
export function getNotifications(page = 0, size = 10) {
    if (!NOTIFICATIONS_ENABLED) return Promise.resolve({ data: { content: [], totalElements: 0 } });
    return api.get('/api/users/notifications', { params: { page, size } });
}

export function getUnreadCount() {
    if (!NOTIFICATIONS_ENABLED) return Promise.resolve({ data: 0 });
    return api.get('/api/users/notifications/unread-count');
}

export function markNotificationRead(id) {
    // if id looks like a local client notification id, update localStorage instead of calling backend
    try {
        if (typeof id === 'string' && id.startsWith('local-')) {
            const raw = localStorage.getItem('localNotifications') || '[]';
            const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
            const updated = arr.map(n => n.id === id ? { ...n, read: true } : n);
            localStorage.setItem('localNotifications', JSON.stringify(updated));
            return Promise.resolve({ data: null });
        }
    } catch (e) {
        // ignore localStorage errors and fall back to server call
    }
    if (!NOTIFICATIONS_ENABLED) return Promise.resolve();
    return api.put(`/api/users/notifications/${id}/read`);
}

export function deleteNotification(id) {
    // if id looks like a local client notification id, remove from localStorage instead of calling backend
    try {
        if (typeof id === 'string' && id.startsWith('local-')) {
            const raw = localStorage.getItem('localNotifications') || '[]';
            const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
            const updated = arr.filter(n => n.id !== id);
            localStorage.setItem('localNotifications', JSON.stringify(updated));
            return Promise.resolve({ data: null });
        }
    } catch (e) {
        // ignore localStorage errors and fall back to server call
    }
    if (!NOTIFICATIONS_ENABLED) return Promise.resolve();
    return api.delete(`/api/users/notifications/${id}`);
}

export function clearNotifications() {
    // clear local notifications always
    try {
        localStorage.removeItem('localNotifications');
    } catch (e) { /* ignore */ }
    if (!NOTIFICATIONS_ENABLED) return Promise.resolve({ data: null });
    // attempt server clear; if backend doesn't support DELETE on this endpoint, treat as success
    return api.delete('/api/users/notifications').catch(err => {
        const status = err?.response?.status;
        if (status === 405) return Promise.resolve({ data: null });
        return Promise.reject(err);
    });
}

// Dev helper: create a test notification on the server for the authenticated user.
// Only active when NOTIFICATIONS_ENABLED is true and NODE_ENV !== 'production'.
export function createNotification(payload) {
    if (!NOTIFICATIONS_ENABLED) return Promise.resolve({ data: null });
    if (process.env.NODE_ENV === 'production') return Promise.reject(new Error('createNotification is dev-only'));
    return api.post('/api/users/notifications', payload);
}