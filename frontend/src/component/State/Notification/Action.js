import { NOTIFICATIONS_ENABLED, getNotifications as fetchNotifications, markNotificationRead as apiMarkRead, deleteNotification as apiDeleteNotification, clearNotifications as apiClearNotifications } from '../../config/api';
import {
  GET_NOTIFICATIONS_REQUEST,
  GET_NOTIFICATIONS_SUCCESS,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE,
  DELETE_NOTIFICATION_REQUEST,
  DELETE_NOTIFICATION_SUCCESS,
  DELETE_NOTIFICATION_FAILURE,
  CLEAR_NOTIFICATIONS_REQUEST,
  CLEAR_NOTIFICATIONS_SUCCESS,
  CLEAR_NOTIFICATIONS_FAILURE,
} from './ActionTypes';

// If backend exists, endpoints should be:
// GET /api/users/notifications
// PUT /api/users/notifications/:id/read
// DELETE /api/users/notifications/:id
// DELETE /api/users/notifications (to clear)

export const getNotifications = ({ jwt } = {}) => async (dispatch) => {
  dispatch({ type: GET_NOTIFICATIONS_REQUEST });
  try {
    if (!NOTIFICATIONS_ENABLED) {
      // backend not available: return empty list without network call
      return dispatch({ type: GET_NOTIFICATIONS_SUCCESS, payload: [] });
    }
  // Authorization header is attached by the api interceptor; do not add it here to avoid double-prefixing
  // use the helper so other callers can reuse the same interface
  let res;
  try {
    res = await fetchNotifications();
  } catch (e) {
    // network error while fetching server notifications
    if (process.env.NODE_ENV !== 'production') console.warn('fetchNotifications network error', e && (e.response || e.message || e));
    throw e;
  }
  // Normalize response: backend may return a paged object { content: [], totalElements } or a raw array
  let payload = [];
  if (Array.isArray(res.data)) payload = res.data;
  else if (res.data && Array.isArray(res.data.content)) payload = res.data.content;
  else if (res.data && Array.isArray(res.data.notifications)) payload = res.data.notifications;
  // fallback: if server returned a single object, wrap it
  else if (res.data && typeof res.data === 'object' && res.data.id) payload = [res.data];
  dispatch({ type: GET_NOTIFICATIONS_SUCCESS, payload });
  } catch (err) {
    // backend may not be implemented; return empty list instead of hard failure
  if (process.env.NODE_ENV !== 'production') console.warn('getNotifications failed, falling back to local mock', err && (err.message || err));
    dispatch({ type: GET_NOTIFICATIONS_SUCCESS, payload: [] });
  }
};

export const markNotificationRead = ({ jwt, id } = {}) => async (dispatch) => {
  dispatch({ type: MARK_NOTIFICATION_READ_REQUEST, payload: id });
  try {
    if (!NOTIFICATIONS_ENABLED) {
      // simulate success locally
      return dispatch({ type: MARK_NOTIFICATION_READ_SUCCESS, payload: id });
    }
  // use helper which handles local ids and backend call
  await apiMarkRead(id);
  dispatch({ type: MARK_NOTIFICATION_READ_SUCCESS, payload: id });
  } catch (err) {
  if (process.env.NODE_ENV !== 'production') console.warn('markNotificationRead failed', err.message || err);
    dispatch({ type: MARK_NOTIFICATION_READ_FAILURE, payload: id });
  }
};

export const deleteNotification = ({ jwt, id } = {}) => async (dispatch) => {
  dispatch({ type: DELETE_NOTIFICATION_REQUEST, payload: id });
  try {
    if (!NOTIFICATIONS_ENABLED) {
      // simulate delete locally
      return dispatch({ type: DELETE_NOTIFICATION_SUCCESS, payload: id });
    }
  await apiDeleteNotification(id);
  dispatch({ type: DELETE_NOTIFICATION_SUCCESS, payload: id });
  } catch (err) {
  if (process.env.NODE_ENV !== 'production') console.warn('deleteNotification failed', err.message || err);
    dispatch({ type: DELETE_NOTIFICATION_FAILURE, payload: id });
  }
};

export const clearNotifications = ({ jwt } = {}) => async (dispatch) => {
  dispatch({ type: CLEAR_NOTIFICATIONS_REQUEST });
  try {
    if (!NOTIFICATIONS_ENABLED) {
      // simulate clear locally
      return dispatch({ type: CLEAR_NOTIFICATIONS_SUCCESS });
    }
  await apiClearNotifications();
  dispatch({ type: CLEAR_NOTIFICATIONS_SUCCESS });
  } catch (err) {
  if (process.env.NODE_ENV !== 'production') console.warn('clearNotifications failed', err.message || err);
    dispatch({ type: CLEAR_NOTIFICATIONS_FAILURE });
  }
};

// Add a client-side notification (useful when backend notifications are disabled)
export const addLocalNotification = (payload) => (dispatch) => {
  // ensure a simple id and createdAt
  const n = {
    id: payload.id || `local-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    title: payload.title || payload.type || 'Notification',
    body: payload.body || '',
    type: payload.type || 'generic',
    read: false,
    createdAt: payload.createdAt || new Date().toISOString(),
    data: payload.data || null,
  };
  // debug/log so developer can verify this ran
  // keep adding local notifications silent in console; developers can enable NODE_ENV=development to see warnings
  dispatch({ type: 'ADD_NOTIFICATION', payload: n });
  // IMPORTANT: Toast notifications are ephemeral and MUST NOT be persisted, otherwise
  // they will replay on refresh causing duplicate auth/payment messages. Only persist
  // non-toast notifications (e.g., order status, events) so users retain meaningful state.
  if (n.type !== 'toast') {
    try {
      const existing = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      existing.unshift(n);
      // keep last 200 notifications
      const sanitized = existing.filter(x => x && x.type !== 'toast'); // defensive: strip any legacy toasts
      localStorage.setItem('localNotifications', JSON.stringify(sanitized.slice(0, 200)));
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.warn('failed to persist local notification', e);
    }
  }
};
