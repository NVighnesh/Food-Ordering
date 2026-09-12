import {
  CREATE_ADDRESS_REQUEST,
  CREATE_ADDRESS_SUCCESS,
  CREATE_ADDRESS_FAILURE,
  GET_ADDRESSES_REQUEST,
  GET_ADDRESSES_SUCCESS,
  GET_ADDRESSES_FAILURE,
  SELECT_ADDRESS,
  DELETE_ADDRESS_REQUEST,
  DELETE_ADDRESS_SUCCESS,
  DELETE_ADDRESS_FAILURE,
  UPDATE_ADDRESS_REQUEST,
  UPDATE_ADDRESS_SUCCESS,
  UPDATE_ADDRESS_FAILURE,
} from "./ActionTypes";

const isAddressEmpty = (a) => {
  if (!a) return true;
  const street = a.streetAddress || a.street;
  return [street, a.city, a.state, a.postalCode, a.country].every(
    (v) => !v || `${v}`.trim() === ""
  );
};

const initialState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
};

export const addressReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_ADDRESS_REQUEST:
    case GET_ADDRESSES_REQUEST:
      return { ...state, loading: true, error: null };
    case CREATE_ADDRESS_SUCCESS: {
        if (isAddressEmpty(action.payload)) {
          return { ...state, loading: false };
        }
        // normalize incoming address fields for comparison
        const normalize = (a) => ({
          street: (a.streetAddress || a.street || "").trim().toLowerCase(),
          city: (a.city || "").trim().toLowerCase(),
          state: (a.state || "").trim().toLowerCase(),
          postalCode: (a.postalCode || a.postal_code || a.postal || "").toString().trim(),
          country: (a.country || "").trim().toLowerCase(),
        });
        const incoming = normalize(action.payload || {});
        // try to find an existing address that matches these key fields
        const existing = state.list.find((a) => {
          const n = normalize(a || {});
          return (
            n.street === incoming.street &&
            n.city === incoming.city &&
            n.state === incoming.state &&
            n.postalCode === incoming.postalCode &&
            n.country === incoming.country
          );
        });
        if (existing) {
          // prefer server-provided id if it differs, but avoid duplicating the entry
          const merged = { ...(existing || {}), ...(action.payload || {}) };
          const updatedList = state.list.map((a) => (a === existing ? merged : a));
          return { ...state, loading: false, list: updatedList, selected: merged };
        }
        return {
          ...state,
          loading: false,
          list: [action.payload, ...state.list],
          selected: action.payload,
        };
    }
    case GET_ADDRESSES_SUCCESS:
      return {
        ...state,
        loading: false,
        list: (action.payload || []).filter((a) => !isAddressEmpty(a)),
      };
    case CREATE_ADDRESS_FAILURE:
    case GET_ADDRESSES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case SELECT_ADDRESS:
      return { ...state, selected: action.payload };
    case DELETE_ADDRESS_REQUEST:
    case UPDATE_ADDRESS_REQUEST:
      return { ...state, loading: true, error: null };
    case DELETE_ADDRESS_SUCCESS: {
      const filtered = state.list.filter(a => a.id !== action.payload);
      const selected = state.selected?.id === action.payload ? null : state.selected;
      return { ...state, loading: false, list: filtered, selected };
    }
    case UPDATE_ADDRESS_SUCCESS: {
      if (isAddressEmpty(action.payload)) {
        // treat update to empty as deletion of content; remove from list
        const filtered = state.list.filter(a => a.id !== action.payload.id);
        const selected = state.selected?.id === action.payload.id ? null : state.selected;
        return { ...state, loading: false, list: filtered, selected };
      }
      const updatedList = state.list.map((a) =>
        a.id === action.payload.id ? action.payload : a
      );
      const selected =
        state.selected?.id === action.payload.id ? action.payload : state.selected;
      return { ...state, loading: false, list: updatedList, selected };
    }
    case DELETE_ADDRESS_FAILURE:
    case UPDATE_ADDRESS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};