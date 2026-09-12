import { isPresentInFavorites } from "../../config/logic";
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
} from "./ActionType";

const inititalState = {
  user: null,
  isLoading: false,
  error: null,
  jwt: null,
  // restore persisted favorites from localStorage so they survive page reloads
  favorites: (() => {
    try {
      const raw = localStorage.getItem('favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  })(),
  success: null,
};

export const authReducer = (state = inititalState, action) => {
  // helper to normalize various shapes of favorites into an array
  const normalizeFavorites = (f) => {
    if (!f) return [];
    if (Array.isArray(f)) return f;
    if (f && Array.isArray(f.favorites)) return f.favorites;
    if (typeof f === 'object') {
      try {
        const vals = Object.values(f).filter(v => v && typeof v === 'object');
        if (vals.length > 0) return vals;
      } catch (e) { /* ignore */ }
    }
    return [];
  };

  switch (action.type) {
    case REGISTER_REQUEST:
    case LOGIN_REQUEST:
    case GET_USER_REQUEST:
    case ADD_TO_FAVORITE_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
        success: null,
      };
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,

        jwt: action.payload,
        success: "register successful",
      };
    case GET_USER_SUCCESS:
      {
        const serverFavorites = normalizeFavorites(action.payload && action.payload.favorites);
        // if server returned no favorites, keep any existing local favorites so a refresh
        // doesn't wipe out client-side favorites that were stored while the user had a valid token
        const finalFavorites = (serverFavorites && serverFavorites.length) ? serverFavorites : normalizeFavorites(state.favorites);
        try { localStorage.setItem('favorites', JSON.stringify(finalFavorites)); } catch (e) {}
        return {
          ...state,
          isLoading: false,
          user: action.payload,
          favorites: finalFavorites,
        };
      }
    case ADD_TO_FAVORITE_SUCCESS:
      {
        const newFavorites = (() => {
          const current = normalizeFavorites(state.favorites);
          const present = isPresentInFavorites(current, action.payload);
          if (present) return current.filter((item) => (item && (item.id || item._id || '').toString()) !== (action.payload && (action.payload.id || action.payload._id || '').toString()));
          return [action.payload, ...current];
        })();
        try { localStorage.setItem('favorites', JSON.stringify(newFavorites)); } catch(e){}
        return {
          ...state,
          isLoading: false,
          error: null,
          favorites: newFavorites,
        };
      }
    case LOGOUT:
      // On logout: clear in-memory favorites (and logout action now removes both legacy and scoped favorites keys)
      return {
        ...inititalState,
        user: null,
        jwt: null,
        // empty the Redux favorites so the app renders as a logged-out user
        favorites: [],
      };
    case REGISTER_FAILURE:
    case LOGIN_FAILURE:
    case GET_USER_FAILURE:
    case ADD_TO_FAVORITE_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        success: null,
      };

    default:
      return state;
  }
};
