

import { api } from "../../config/api";
import {
  ADD_ITEM_TO_CART_FAILURE,
  ADD_ITEM_TO_CART_REQUEST,
  ADD_ITEM_TO_CART_SUCCESS,
  CLEAR_CART_FAILURE,
  CLEAR_CART_REQUEST,
  CLEAR_CART_SUCCESS,
  FIND_CART_FAILURE,
  FIND_CART_REQUEST,
  FIND_CART_SUCCESS,
  GET_ALL_CART_ITEMS_FAILURE,
  GET_ALL_CART_ITEMS_REQUEST,
  GET_ALL_CART_ITEMS_SUCCESS,
  REMOVE_CARTITEM_FAILURE,
  REMOVE_CARTITEM_REQUEST,
  REMOVE_CARTITEM_SUCCESS,
  UPDATE_CARTITEM_FAILURE,
  UPDATE_CARTITEM_REQUEST,
  UPDATE_CARTITEM_SUCCESS,
} from "./ActionTypes";

export const findCart = (token) => {
  return async (dispatch) => {
    dispatch({ type: FIND_CART_REQUEST });
    try {
      const t = token || sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
      // Ensure leading slash so baseURL + "/api/cart" not concatenated incorrectly
      const response = await api.get(`/api/cart`, {
        headers: {
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
      });
      let payload = response?.data;
      // If backend returned a JSON string accidentally, try to parse it
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
      }
      if (!payload || typeof payload !== 'object') payload = {};
      // Normalize shape: ensure items array exists
      if (!Array.isArray(payload.items)) payload.items = [];
      console.log("my cart ", payload);
      dispatch({ type: FIND_CART_SUCCESS, payload });
    } catch (error) {
      console.error("Error finding cart:", error);
      dispatch({ type: FIND_CART_FAILURE, payload: error.message });
    }
  };
};

export const getAllCartItems = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: GET_ALL_CART_ITEMS_REQUEST });
    try {
      const response = await api.get(`/api/carts/${reqData.cartId}/items`, {
        headers: {
          Authorization: `Bearer ${reqData.token}`,
        },
      });
      dispatch({ type: GET_ALL_CART_ITEMS_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: GET_ALL_CART_ITEMS_FAILURE, payload: error });
    }
  };
};
export const addItemToCart = (reqData) => {
  return async (dispatch, getState) => {
    dispatch({ type: ADD_ITEM_TO_CART_REQUEST });
    try {
      // Helper: normalize a single cart item so UI can read item.name, item.images, item.price
      const normalizeItem = (it) => {
        if (!it || typeof it !== 'object') return it;
        const item = { ...it };
        // prefer top-level fields, fall back to nested food.*
        if (!item.name && item.food && item.food.name) item.name = item.food.name;
        if (!Array.isArray(item.images)) {
          if (Array.isArray(item.food && item.food.images)) item.images = item.food.images;
          else if (typeof item.images === 'string') item.images = [item.images];
          else item.images = item.images || [];
        }
        if (typeof item.price === 'undefined' || item.price === null) {
          // support different server conventions
          item.price = item.price ?? item.food?.price ?? item.food?.priceInCents ?? 0;
        }
        return item;
      };
      const normalizeItemsArray = (arr) => Array.isArray(arr) ? arr.map(normalizeItem) : arr;
      // Optimistic update: merge into existing cart items in local state so UI updates immediately
      const state = getState();
      const currentItems = state.cart?.cartItems || [];
      const existing = currentItems.find((it) => it.food?.id === reqData.cartItem.foodId || it.id === reqData.cartItem.cartItemId || it.foodId === reqData.cartItem.foodId);
      let optimisticPayload;
      if (existing) {
        const newQty = (existing.quantity || 0) + (reqData.cartItem.quantity || 1);
        const updated = { ...existing, quantity: newQty, totalPrice: (Number(existing.totalPrice || 0) + (Number(reqData.cartItem.quantity || 1) * (Number(existing.food?.price || existing.price || 0)))) };
        optimisticPayload = updated;
      } else {
        // create a minimal optimistic item
        optimisticPayload = {
          id: Math.random().toString(36).substr(2, 9),
          food: { id: reqData.cartItem.foodId },
          quantity: reqData.cartItem.quantity || 1,
          ingredients: reqData.cartItem.ingredients || [],
          totalPrice: (reqData.cartItem.quantity || 1) * (reqData.cartItem.price || 0),
          // include any provided display fields from the server change so UI can render immediately
          name: reqData.cartItem.name || (reqData.cartItem.food && reqData.cartItem.food.name),
          images: Array.isArray(reqData.cartItem.images) ? reqData.cartItem.images : (typeof reqData.cartItem.images === 'string' ? [reqData.cartItem.images] : undefined),
          price: typeof reqData.cartItem.price !== 'undefined' ? reqData.cartItem.price : undefined,
        };
      }

      // dispatch optimistic success to merge item locally
      dispatch({ type: ADD_ITEM_TO_CART_SUCCESS, payload: optimisticPayload });

      const { data } = await api.put(`/api/cart/add`, reqData.cartItem, {
        headers: {
          Authorization: `Bearer ${reqData.token}`,
        },
      });
      console.log("add item to cart response", data);
      // If server returned a full cart or cartItems array, dispatch that payload so reducer can replace items.
      // If server returned a single cart item object (common), dispatch it so UI gets the full `food` object
      // (name, images) instead of the optimistic minimal item.
      if (data) {
        if (Array.isArray(data.items) || Array.isArray(data.cartItems)) {
          const items = Array.isArray(data.items) ? data.items : data.cartItems;
          const normalized = normalizeItemsArray(items);
          // keep top-level cart metadata but ensure both items and cartItems are normalized arrays
          const out = { ...(data || {}), items: normalized, cartItems: normalized };
          dispatch({ type: ADD_ITEM_TO_CART_SUCCESS, payload: out });
        } else if (Array.isArray(data)) {
          // sometimes API returns an array of items
          const normalized = normalizeItemsArray(data);
          dispatch({ type: ADD_ITEM_TO_CART_SUCCESS, payload: { items: normalized } });
        } else {
          // assume single cart item object
          const normalized = normalizeItem(data);
          dispatch({ type: ADD_ITEM_TO_CART_SUCCESS, payload: normalized });
        }
      }

      // Refresh cart state from server to ensure totals and merged items are accurate
      await dispatch(findCart(reqData.token));
    } catch (error) {
      console.error("Error adding item to cart:", error);
      dispatch({ type: ADD_ITEM_TO_CART_FAILURE, payload: error.message });
    }
  };
};
export const updateCartItem = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_CARTITEM_REQUEST });
    try {
      const url = `/api/cart-item/update`;
      // Normalize payload: include both id and cartItemId to match different backend conventions
      const body = {
        ...reqData.data,
        id: reqData.data.id || reqData.data.cartItemId,
        cartItemId: reqData.data.cartItemId || reqData.data.id,
      };
      // Accept either `token` or `jwt` from callers; fallback to localStorage
      const token = reqData.token || reqData.jwt || localStorage.getItem("jwt");
      console.log("Updating cart item - URL:", url, "payload:", body, "token present:", !!token);

      const { data } = await api.put(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("update cart item response", data);
  dispatch({ type: UPDATE_CARTITEM_SUCCESS, payload: data });
  // Refresh cart to ensure UI totals and merged quantities reflect server
  dispatch(findCart(token));
    } catch (error) {
      // Log detailed axios error info for debugging
      console.error("Error updating cart item:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      const payload = error.response?.data || error.message || "Unknown error";
      dispatch({ type: UPDATE_CARTITEM_FAILURE, payload });
    }
  };
};

export const removeCartItem = ({ cartItemId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: REMOVE_CARTITEM_REQUEST });
    // Optimistic remove so UI updates immediately
    dispatch({ type: REMOVE_CARTITEM_SUCCESS, payload: cartItemId });
    try {
      // Try a set of common endpoints the backend might expose. Some backends use
      // `/api/cart-item/:id`, others `/api/cart/items/:id`, or a verb-like
      // `/api/cart-item/:id/remove`. Include variants with and without trailing
      // slash. This reduces 404s caused by minor endpoint differences.
      const urlsToTry = [
        `/api/cart-item/${cartItemId}`,
        `/api/cart-item/${cartItemId}/`,
        `/api/cart-item/${cartItemId}/remove`,
        `/api/cart/items/${cartItemId}`,
        `/api/cart/items/${cartItemId}/`,
        `/api/cart/${cartItemId}/items/${cartItemId}`,
      ];
      let succeeded = false;
      for (const url of urlsToTry) {
        try {
          if (process.env.NODE_ENV !== 'production') console.debug('Attempting DELETE', url);
          await api.delete(url, { headers: { Authorization: `Bearer ${jwt}` } });
          succeeded = true;
          break;
        } catch (err) {
          // continue trying other variants. Log more details in dev for easier debugging.
          const status = err?.response?.status;
          if (process.env.NODE_ENV !== 'production') {
            console.debug(`Delete attempt to ${url} returned ${status}`, err?.response?.data || err.message);
          }
          // non-404 errors are noteworthy
          if (err.response && err.response.status && err.response.status !== 404) {
            console.warn(`Delete attempt to ${url} failed with status ${err.response.status}`);
          }
          // otherwise keep trying other URL variants
        }
      }
      await dispatch(findCart(jwt));
      if (!succeeded) {
        // If none of the endpoints succeeded, surface a failure but still refreshed local state
        dispatch({ type: REMOVE_CARTITEM_FAILURE, payload: `Failed to delete cart item ${cartItemId}` });
      }
      return;
    } catch (error) {
      console.error("Error removing cart item (fallback):", error);
      await dispatch(findCart(jwt));
      dispatch({ type: REMOVE_CARTITEM_FAILURE, payload: error.message || "Unknown error" });
      return;
    }
  };
};
export const clearCartAction = (token) => {
  return async (dispatch) => {
    dispatch({ type: CLEAR_CART_REQUEST });
    try {
      const t = token || sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
      const headers = t ? { Authorization: `Bearer ${t}` } : {};
      const { data } = await api.put(
        `/api/cart/clear`,
        {},
        { headers }
      );
      console.log("clear cart response", data);
      dispatch({ type: CLEAR_CART_SUCCESS, payload: data });
    } catch (error) {
      console.error("Error clearing cart:", error);
      dispatch({ type: CLEAR_CART_FAILURE, payload: error.message });
    }
  };
};
