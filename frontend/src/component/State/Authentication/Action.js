import axios from "axios";
import { api, API_URL } from "../../config/api";
import {
  ADD_TO_FAVORITE_FAILURE,
  ADD_TO_FAVORITE_REQUEST,
  ADD_TO_FAVORITE_SUCCESS,
  GET_USER_FAILURE,
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGOUT,
  REGISTER_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  // we can reuse constants from restaurant slice by dynamic import or hardcode string, but we'll import type
} from "./ActionType";
import { CLEAR_RESTAURANT_STATE } from "../Restaurant/ActionTypes";
import { addLocalNotification } from '../Notification/Action';
import { getRestaurantByUserId } from "../Restaurant/Action";

// Flag key used to mark that the current page load is performing an auth hydration
// rather than an explicit user-initiated login. During hydration we suppress
// welcome/login toasts to avoid duplicate messages on refresh.
const HYDRATION_FLAG_KEY = 'auth_hydrating';

export const registerUser = (reqData) => async (dispatch) => {
  dispatch({ type: REGISTER_REQUEST });
  const { userData, navigate, returnTo, source = 'user' } = reqData || {};
  try {
    console.log("Sending registration data:", userData);
    const { data } = await axios.post(
      `${API_URL}/auth/signup`,
      userData
    );
    if (data.jwt) localStorage.setItem("jwt", data.jwt);
    dispatch({ type: REGISTER_SUCCESS, payload: data.jwt });
    dispatch({ type: CLEAR_RESTAURANT_STATE });
    // Registration success toast (only for direct user initiated action, not programmatic calls)
    try {
      if (source === 'user') {
        dispatch(addLocalNotification({ type: 'toast', title: 'Registration Successful', body: 'Account created successfully', data: { level: 'success', context: 'register' } }));
      }
    } catch(e) { /* ignore */ }
    // Auto-login fetch profile
    try {
      const loginRes = await axios.post(`${API_URL}/auth/signin`, {
        email: userData.email,
        password: userData.password,
      });
      if (loginRes.data?.jwt) {
        localStorage.setItem("jwt", loginRes.data.jwt);
        dispatch({ type: LOGIN_SUCCESS, payload: loginRes.data.jwt });
        dispatch({ type: CLEAR_RESTAURANT_STATE });
        try { await dispatch(getUser(loginRes.data.jwt)); } catch (profileErr) { console.warn("Failed to fetch profile after auto-login", profileErr); }
        // owner fetch
        if (loginRes.data.role === "ROLE_RESTAURANT_OWNER") {
          try { await dispatch(getRestaurantByUserId(loginRes.data.jwt)); } catch(e) { /* ignore */ }
        }
        // Navigate post registration
        if (navigate) {
          if (loginRes.data.role === "ROLE_RESTAURANT_OWNER") navigate("/admin/restaurants"); else navigate(returnTo || "/");
        }
      } else {
        if (navigate) {
          if (data.role === "ROLE_RESTAURANT_OWNER") navigate("/admin/restaurants"); else navigate(returnTo || "/");
        }
      }
    } catch (autoLoginErr) {
      console.warn("Auto-login after signup failed", autoLoginErr);
      try { await dispatch(getUser(data.jwt)); } catch (profileErr) { console.warn("Profile fetch with signup token failed", profileErr); }
      if (navigate) {
        if (data.role === "ROLE_RESTAURANT_OWNER") navigate("/admin/restaurants"); else navigate(returnTo || "/");
      }
    }
  } catch (error) {
    dispatch({ type: REGISTER_FAILURE, payload: error });
    console.log("Error in registerUser action:", error);
  }
};

export const loginUser = (reqData) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });
  const { userData, navigate, source = 'user' } = reqData || {};
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/signin`,
      userData
    );
    if (data.jwt) localStorage.setItem("jwt", data.jwt);
    dispatch({ type: LOGIN_SUCCESS, payload: data.jwt });
    dispatch({ type: CLEAR_RESTAURANT_STATE });
    try {
      await dispatch(getUser(data.jwt));
      try { sessionStorage.removeItem(HYDRATION_FLAG_KEY); } catch(e) { /* ignore */ }
      // only show login toast if action source is user (explicit button) not hydration
      if (source === 'user') {
        let profile = null;
        try { const raw = localStorage.getItem('user_profile'); if (raw) profile = JSON.parse(raw); } catch(e) { /* ignore */ }
        const displayName = profile?.fullName || profile?.name || profile?.username || profile?.email || 'User';
        dispatch(addLocalNotification({ type: 'toast', title: `Welcome back, ${displayName}!`, body: 'Login successful', data: { level: 'success', context: 'login' } }));
      }
    } catch (e) { /* ignore */ }
    const isOwner = data.role === 'ROLE_RESTAURANT_OWNER';
    if (isOwner) { try { await dispatch(getRestaurantByUserId(data.jwt)); } catch(e) { /* ignore */ } }
    if (navigate) navigate(isOwner ? '/admin/restaurants' : '/');
  } catch (error) {
    dispatch({ type: LOGIN_FAILURE, payload: error });
    // existing error toast logic stays
    const status = error?.response?.status;
    const message = (error?.response?.data && (error.response.data.message || error.response.data.error)) || error.message || '';
    const lowerMsg = (message || '').toLowerCase();
    const userNotFound = status === 404 || /user not found|no such user|not registered|email does not exist/i.test(lowerMsg);
    const wrongPassword = /invalid password|bad credentials|password mismatch|wrong password/i.test(lowerMsg) && !userNotFound;
    const wrongEmailFormat = /invalid email|email format/i.test(lowerMsg);
    const genericInvalid = status === 401 || status === 403 || /invalid credentials|unauthorized/i.test(lowerMsg);
    try {
      if (userNotFound) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Credentials', body: 'User does not exist. Register first.', data: { level: 'error', context: 'login', action: 'suggest-register' } }));
      } else if (wrongPassword) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Password', body: 'Enter correct password.', data: { level: 'error', context: 'login' } }));
      } else if (wrongEmailFormat) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Email', body: 'Enter a valid email address.', data: { level: 'error', context: 'login' } }));
      } else if (genericInvalid) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Credentials', body: 'Check email & password.', data: { level: 'error', context: 'login' } }));
      } else {
        dispatch(addLocalNotification({ type: 'toast', title: 'Login Error', body: 'Unable to login.', data: { level: 'error', context: 'login' } }));
      }
    } catch (e) { /* ignore */ }
  }
};

export const getUser = (jwt, { hydrating = false } = {}) => async (dispatch) => {
  if (hydrating) {
    try { sessionStorage.setItem(HYDRATION_FLAG_KEY, '1'); } catch(e) { /* ignore */ }
  }
  dispatch({ type: GET_USER_REQUEST });
  try {
    const { data } = await api.get(`/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    // Merge server-provided favorites with locally stored favorites.
    // - If server returns a non-empty array, union it with local favorites (server first).
    // - If server returns an empty array or no favorites, preserve local favorites.
    let mergedFavorites = [];
    try {
      // user id (string) used for scoping favorites key
      const uid = (data && (data.id || data._id || data.userId || data.user_id)) ? String(data.id || data._id || data.userId || data.user_id) : null;
      const legacyRaw = localStorage.getItem('favorites');
      let legacyFavs = [];
      try { legacyFavs = legacyRaw ? JSON.parse(legacyRaw) : []; } catch (e) { legacyFavs = []; }
      const scopedKey = uid ? `favorites_${uid}` : null;
      let scopedFavs = [];
      if (scopedKey) {
        try {
          const scopedRaw = localStorage.getItem(scopedKey);
          scopedFavs = scopedRaw ? JSON.parse(scopedRaw) : [];
        } catch (e) { scopedFavs = []; }
      }
      const serverFavs = Array.isArray(data?.favorites) ? data.favorites : [];
      const keyOf = (it) => {
        if (!it) return '';
        if (typeof it === 'object') return String(it.id || it._id || it.restaurantId || it.restaurant_id || it.rid || '');
        return String(it);
      };
      const map = new Map();
      // server favorites first (authoritative)
      serverFavs.forEach(it => map.set(keyOf(it), it));
      // then scoped stored favorites
      scopedFavs.forEach(it => { const k = keyOf(it); if (k && !map.has(k)) map.set(k, it); });
      // then legacy if still present
      legacyFavs.forEach(it => { const k = keyOf(it); if (k && !map.has(k)) map.set(k, it); });
      mergedFavorites = Array.from(map.values()).filter(x => x && keyOf(x));
      // persist under scoped key only; remove legacy global key (migration)
      if (scopedKey) {
        try { localStorage.setItem(scopedKey, JSON.stringify(mergedFavorites)); } catch (e) { /* ignore */ }
      }
      try { localStorage.removeItem('favorites'); } catch (e) { /* ignore */ }
    } catch (e) {
      mergedFavorites = Array.isArray(data?.favorites) && data.favorites.length > 0 ? data.favorites : [];
    }

    // attach merged favorites to the profile payload so Redux receives the canonical list
  const profilePayload = { ...(data || {}), favorites: Array.isArray(mergedFavorites) ? mergedFavorites : [] };
  dispatch({ type: GET_USER_SUCCESS, payload: profilePayload });

    // persist lightweight profile for client-side guards
    try {
      localStorage.setItem('user_profile', JSON.stringify(profilePayload));
      if (profilePayload && profilePayload.role) localStorage.setItem('user_role', profilePayload.role);
    } catch (e) { /* ignore */ }
    // persist the merged favorites (if any)
    // For backward compatibility some components still read 'favorites' directly; write a lightweight copy
    try { localStorage.setItem('favorites', JSON.stringify(mergedFavorites || [])); } catch (e) { /* ignore */ }
    console.log("user profile data:", data);
  } catch (error) {
    dispatch({ type: GET_USER_FAILURE, payload: error });
    console.log("Error in getUser action:", error);
  }
  if (hydrating) {
    // Clear hydration flag after work so subsequent explicit logins show toast again
    try { sessionStorage.removeItem(HYDRATION_FLAG_KEY); } catch(e) { /* ignore */ }
  }
};
export const addToFavorite = ({ jwt, restaurantId }) => async (dispatch, getState) => {
  dispatch({ type: ADD_TO_FAVORITE_REQUEST });
  try {
    // capture previous favorites so we can correctly report whether this
    // toggle resulted in an add or a removal (server endpoint toggles)
    const prevFavorites = (getState && getState().auth && getState().auth.favorites) || [];
    // Let the `api` axios instance attach the Authorization header via interceptor.
    const { data } = await api.put(`/api/restaurants/${restaurantId}/add-favorites`);
    // dispatch the toggle payload to update state
    dispatch({ type: ADD_TO_FAVORITE_SUCCESS, payload: data });
    // Read the canonical favorites array from the updated store and persist that
    try {
      const updatedFavorites = (getState && getState().auth && getState().auth.favorites) || [];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));

      // Decide whether the toggle added or removed the item using available clues.
  const payloadIsArray = Array.isArray(data);
  const payloadId = data && (data.id || data._id || null);

  let actionWas = 'updated favorites';

  if (payloadIsArray) {
        // compare lengths as a best-effort heuristic
        if (updatedFavorites.length > (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Added to favorites';
        else if (updatedFavorites.length < (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Removed from favorites';
        else actionWas = 'Updated favorites';
      } else if (payloadId) {
        const present = updatedFavorites.some(item => item && (item.id || item._id) && (item.id || item._id).toString() === payloadId.toString());
        actionWas = present ? 'Added to favorites' : 'Removed from favorites';
      } else {
        // fallback to length comparison
        if (updatedFavorites.length > (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Added to favorites';
        else if (updatedFavorites.length < (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Removed from favorites';
      }

  console.log(actionWas + ':', data);
    } catch (e) { /* ignore */ }
  } catch (error) {
  // Improve error logging to include HTTP status and response body when available
  const status = error?.response?.status;
  const respData = error?.response?.data;
  console.error("Error in addToFavorite action:", { message: error.message, status, respData });
  dispatch({ type: ADD_TO_FAVORITE_FAILURE, payload: respData || error });
  }
};
 
export const logout = ({ source = 'user' } = {}) => async (dispatch) => {
  try {
    let profileName = null;
    try { const raw = localStorage.getItem('user_profile'); if (raw) { const p = JSON.parse(raw); profileName = p.fullName || p.name || p.username || p.email || null; } } catch(e) { /* ignore */ }
    const hydrating = sessionStorage.getItem(HYDRATION_FLAG_KEY) === '1';
    // clear state/storage
    const keys = ['user_profile','user_role','local_cart_v1','localNotifications','cachedOrders_v1','knownOrderStatuses_v1','seenEvents_v1','favorites'];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch(e){} });
    try { localStorage.removeItem('jwt'); } catch(e) {}
    try { sessionStorage.removeItem('jwt'); } catch(e) {}
    try { localStorage.removeItem('payment_in_progress'); } catch(e) {}
    try { if (api && api.defaults && api.defaults.headers) delete api.defaults.headers.common['Authorization']; } catch(e) {}
    dispatch({ type: LOGOUT });
    // Show toast only if explicitly triggered by user (not hydration, not silent) and not payment redirect cleanup
    if (!hydrating && source === 'user') {
      const body = profileName ? `${profileName} has been logged out.` : 'Logged out.';
      dispatch(addLocalNotification({ type: 'toast', title: 'Logout Successful', body, data: { level: 'info', context: 'logout' } }));
    }
  } catch (error) {
    console.log("Error in logout action:", error);
  }
};
