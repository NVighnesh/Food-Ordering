import { LOGOUT } from "../Authentication/ActionType";
import { CREATE_ORDER_SUCCESS } from "../Order/ActionTypes";
import * as actionTypes from "./ActionTypes";

// initialize cart from localStorage so cart survives page refresh
const loadLocalCart = () => {
  try {
    const raw = localStorage.getItem('local_cart_v1');
    if (!raw) return { cart: null, cartItems: [] };
    const parsed = JSON.parse(raw);
    if (!parsed) return { cart: null, cartItems: [] };
    return { cart: parsed.cart || null, cartItems: Array.isArray(parsed.cartItems) ? parsed.cartItems : [] };
  } catch (e) {
    return { cart: null, cartItems: [] };
  }
};

const persisted = loadLocalCart();

const initialState = {
  cart: persisted.cart,
  cartItems: persisted.cartItems,
  loading: false,
  error: null,
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_ORDER_SUCCESS: {
      // Some order flows redirect to payment_url; if present, do not clear local cart yet.
      const payload = action.payload || {};
      if (payload.payment_url) return state;
      try { localStorage.removeItem('local_cart_v1'); } catch (e) {}
      return { ...state, cartItems: [], cart: null };
    }
    case actionTypes.FIND_CART_REQUEST:
    case actionTypes.GET_ALL_CART_ITEMS_REQUEST:
    case actionTypes.UPDATE_CARTITEM_REQUEST:
    case actionTypes.REMOVE_CARTITEM_REQUEST:
      return {
        ...state,

        loading: true,
        error: null,
      };
    case actionTypes.FIND_CART_SUCCESS: {
      // Normalize server payload for different backend shapes
      const payload = (action.payload && typeof action.payload === 'object') ? action.payload : {};
      const serverItems = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.cartItems)
        ? payload.cartItems
        : Array.isArray(payload.itemsList)
        ? payload.itemsList
        : [];

      // If server returned an empty list but we already have optimistic/local items,
      // prefer preserving the local items so the UI doesn't flash-empty immediately
      // after an optimistic add (backend may be eventually consistent).
      const finalItems = (Array.isArray(serverItems) && serverItems.length === 0 && Array.isArray(state.cartItems) && state.cartItems.length > 0)
        ? state.cartItems
        : serverItems;

      // Ensure numeric totalPrice on items
      const normalizedItems = finalItems.map(it => ({ ...it, totalPrice: Number(it.totalPrice || it.price || it.food?.price || 0) }));
      const priceSum = normalizedItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);

      // Keep cart metadata from server but ensure items are the normalizedItems so UI components that read cart.items stay consistent
      const nextState = {
        ...state,
        loading: false,
        cart: { ...(payload || {}), items: normalizedItems, price: priceSum, total: payload.total ?? priceSum },
        cartItems: normalizedItems,
      };
      try { localStorage.setItem('local_cart_v1', JSON.stringify({ cart: nextState.cart, cartItems: nextState.cartItems })); } catch (e) {}
      return nextState;
    }
    case actionTypes.CLEAR_CART_SUCCESS: {
      // On explicit clear cart success we ALWAYS drop existing items regardless of server echo
      try { localStorage.removeItem('local_cart_v1'); } catch (e) {}
      return { ...state, loading: false, cartItems: [], cart: null };
    }
    case actionTypes.ADD_ITEM_TO_CART_SUCCESS: {
      const payload = action.payload || {};
      // If server returned full cart, replace
      if (payload.items && Array.isArray(payload.items)) {
        const priceSum = payload.items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
        return {
          ...state,
          loading: false,
          cart: { ...payload, price: priceSum, total: payload.total ?? priceSum },
          cartItems: payload.items,
        };
      }

      // Otherwise payload may be an optimistic single cartItem (merge)
      const addedItem = payload;
      const existsIndex = state.cartItems.findIndex((i) => i.id === addedItem.id || (i.food && i.food.id === addedItem.food?.id));
      let newCartItems;
      if (existsIndex !== -1) {
        newCartItems = state.cartItems.map((i) =>
          i.id === addedItem.id || (i.food && i.food.id === addedItem.food?.id) ? { ...i, ...addedItem } : i
        );
      } else {
        newCartItems = [addedItem, ...state.cartItems];
      }
      const priceSum = newCartItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
      const nextState = {
        ...state,
        loading: false,
        cartItems: newCartItems,
        cart: { ...state.cart, price: priceSum, total: priceSum },
      };
      try { localStorage.setItem('local_cart_v1', JSON.stringify({ cart: nextState.cart, cartItems: nextState.cartItems })); } catch (e) {}
      return nextState;
    }

  // persist after cart mutation
  // NOTE: fallthrough not available here; we'll write to localStorage in each return path below as needed
    case actionTypes.UPDATE_CARTITEM_SUCCESS:
      {
        const updatedItems = state.cartItems.map((item) => (item.id === action.payload.id ? action.payload : item));
        const priceSum = updatedItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
        const nextState = {
          ...state,
          loading: false,
          cartItems: updatedItems,
          cart: { ...state.cart, price: priceSum, total: priceSum },
        };
        try { localStorage.setItem('local_cart_v1', JSON.stringify({ cart: nextState.cart, cartItems: nextState.cartItems })); } catch (e) {}
        return nextState;
      }
  case actionTypes.REMOVE_CARTITEM_SUCCESS:
      {
        const newCartItems = state.cartItems.filter((item) => item.id !== action.payload);
        const priceSum = newCartItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
        const nextState = {
          ...state,
          loading: false,
          cartItems: newCartItems,
          cart: { ...state.cart, price: priceSum, total: priceSum },
        };
        try { localStorage.setItem('local_cart_v1', JSON.stringify({ cart: nextState.cart, cartItems: nextState.cartItems })); } catch (e) {}
        return nextState;
      }
    case actionTypes.FIND_CART_FAILURE:
    case actionTypes.UPDATE_CARTITEM_FAILURE:
    case actionTypes.REMOVE_CARTITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case LOGOUT:
      localStorage.removeItem("jwt");
      try { localStorage.removeItem('local_cart_v1'); } catch (e) {}
      return {
        ...state,
        cartItems: [],
        cart: null,
        success: "logout successfully",
      };
    case 'CLEAR_LOCAL_CART':
      try { localStorage.removeItem('local_cart_v1'); } catch (e) {}
      return { ...state, cartItems: [], cart: null };
    default:
      return state;
  }
};
export default cartReducer;