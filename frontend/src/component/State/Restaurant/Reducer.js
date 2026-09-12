import * as actionTypes from "./ActionTypes";

const initialState = {
  restaurants: [],
  usersRestaurants: [],
  restaurant: null,
  loading: false,
  error: null,
  events: [],
  restaurantEvents: [],
  categories: [],
};

// helper to ensure event objects have an `id` property frontend expects
const normalizeEvent = (e) => {
  if (!e) return e;
  // prefer existing id, otherwise map _id to id
  const id = e.id || e._id || (e._id ? String(e._id) : undefined);
  return { ...e, id };
};

const normalizeEventsArray = (arr) => Array.isArray(arr) ? arr.map(normalizeEvent) : [];

const restaurantReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.CREATE_RESTAURANT_REQUEST:
    case actionTypes.GET_ALL_RESTAURANTS_REQUEST:
    case actionTypes.DELETE_RESTAURANT_REQUEST:
    case actionTypes.UPDATE_RESTAURANT_REQUEST:
    case actionTypes.GET_RESTAURANT_BY_ID_REQUEST:
    case actionTypes.CREATE_CATEGORY_REQUEST:
    case actionTypes.GET_RESTAURANTS_CATEGORIES_REQUEST: // plural variant
    case actionTypes.GET_RESTAURANTS_CATEGORY_REQUEST: // singular variant
      return {
        ...state,
        loading: true,
        error: null,
      };
    case actionTypes.CREATE_RESTAURANT_SUCCESS: {
      const payload = action.payload;
      const normalized = Array.isArray(payload)
        ? payload
        : payload && payload.id
          ? [payload]
          : [];
      return {
        ...state,
        loading: false,
        usersRestaurants: normalized,
      };}
    case actionTypes.GET_ALL_RESTAURANTS_SUCCESS:
      // normalize payload: backend may return either an array or a paged object { content: [] }
      const payload = action.payload;
      const restaurantsArr = Array.isArray(payload)
        ? payload
        : (payload && Array.isArray(payload.content) ? payload.content : []);
      return {
        ...state,
        loading: false,
        restaurants: restaurantsArr,
      };
    case actionTypes.GET_RESTAURANT_BY_ID_SUCCESS:
      return {
        ...state,
        loading: false,
        restaurant: action.payload,
      };
    case actionTypes.GET_RESTAURANT_BY_USER_ID_SUCCESS:
    case actionTypes.UPDATE_RESTAURANT_STATUS_SUCCESS:
    case actionTypes.UPDATE_RESTAURANT_SUCCESS: {
      const payload = action.payload;
      const normalized = Array.isArray(payload)
        ? payload
        : payload && payload.id
          ? [payload]
          : [];
      return {
        ...state,
        loading: false,
        usersRestaurants: normalized,
      };}
    case actionTypes.DELETE_RESTAURANT_SUCCESS:
      return {
        ...state,
        loading: false,
        restaurants: state.restaurants.filter(
          (item) => item.id !== action.payload
        ),
        usersRestaurants: Array.isArray(state.usersRestaurants)
          ? state.usersRestaurants.filter((item) => item.id !== action.payload)
          : [],
      };
    case actionTypes.CREATE_EVENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        events: [...state.events, normalizeEvent(action.payload)],
        restaurantEvents: [...state.restaurantEvents, normalizeEvent(action.payload)],
      };
    case actionTypes.GET_ALL_EVENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        events: normalizeEventsArray(action.payload),
      };
    case actionTypes.GET_RESTAURANTS_EVENT_SUCCESS:
      return {
        ...state,
        loading: false,
        restaurantEvents: normalizeEventsArray(action.payload),
      };
    case actionTypes.DELETE_EVENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        events: state.events.filter((item) => item.id !== action.payload),
        restaurantEvents: state.restaurantEvents.filter(
          (item) => item.id !== action.payload
        ),
      };
    case actionTypes.CREATE_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: [...state.categories, action.payload],
      };
    case actionTypes.GET_RESTAURANTS_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: action.payload,
      };
    case actionTypes.CREATE_RESTAURANT_FAILURE:
    case actionTypes.GET_ALL_RESTAURANTS_FAILURE:
    case actionTypes.DELETE_RESTAURANT_FAILURE:
    case actionTypes.UPDATE_RESTAURANT_FAILURE:
    case actionTypes.GET_RESTAURANT_BY_ID_FAILURE:
    case actionTypes.CREATE_EVENTS_FAILURE:
    case actionTypes.CREATE_CATEGORY_FAILURE:
    case actionTypes.GET_RESTAURANTS_CATEGORIES_FAILURE: // plural variant
    case actionTypes.GET_RESTAURANTS_CATEGORY_FAILURE: // singular variant
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case actionTypes.CLEAR_RESTAURANT_STATE:
      return initialState;
    default:
      return state;
  }
};

export default restaurantReducer;
