import {
  GET_USERS_ORDERS_REQUEST,
  GET_USERS_ORDERS_SUCCESS,
  GET_USERS_ORDERS_FAILURE,
} from "./ActionTypes";

// Attempt to hydrate initial orders from a local cache so the UI shows orders
// immediately after a refresh while the app re-fetches fresh data in the
// background. The cache key is maintained by getUsersOrders action.
const loadCachedOrders = () => {
  try {
    const raw = localStorage.getItem('cachedOrders_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // normalized shape may be produced by getUsersOrders, but normalizeOrder
    // is declared later in this file (const) and not hoisted. To avoid a
    // ReferenceError during module initialization, return the parsed array
    // directly; the reducer will normalize incoming orders on GET_USERS_ORDERS_SUCCESS.
    return parsed;
  } catch (e) {
    return [];
  }
};

const initialState = {
  loading: false,
  orders: loadCachedOrders(),
  error: null,
  notifications: [],
};

// Normalize an order object coming from various API shapes to a stable
// frontend shape. Ensure `id` exists and `items` is always an array.
const extractItems = (o) => {
  if (!o || typeof o !== 'object') return [];
  // common keys used by different backends
  const candidates = [
    'items', 'orderItems', 'order_items', 'cartItems', 'cart_items', 'lineItems', 'orderLines', 'order_lines',
  ];
  for (const k of candidates) {
    const val = o[k];
    if (Array.isArray(val)) return val;
    // nested shapes: e.g., { orderItems: { items: [...] } }
    if (val && typeof val === 'object' && Array.isArray(val.items)) return val.items;
  }
  // try under cart.*
  if (o.cart && typeof o.cart === 'object') {
    if (Array.isArray(o.cart.items)) return o.cart.items;
    if (Array.isArray(o.cart.cartItems)) return o.cart.cartItems;
    if (Array.isArray(o.cart.cart_items)) return o.cart.cart_items;
  }
  // fallback: sometimes items exist under food/items keys
  if (Array.isArray(o.cartItems)) return o.cartItems;
  if (Array.isArray(o.order_items)) return o.order_items;
  // Flexible fallback: scan other keys for an array that looks like order items.
  try {
    const keys = Object.keys(o || {});
    for (const k of keys) {
      try {
        const val = o[k];
        if (!Array.isArray(val)) continue;
        if (val.length === 0) return val; // empty array plausible
        // check first few elements for item-like properties
        const sample = val[0];
        if (sample && typeof sample === 'object') {
          const hasItemLike = ['name', 'title', 'productId', 'food', 'quantity', 'qty', 'price', 'unitPrice', 'totalPrice'].some(pk => (pk in sample));
          if (hasItemLike) return val;
        }
      } catch (e) { /* ignore per-key errors */ }
    }
  } catch (e) { /* ignore overall fallback errors */ }
  return [];
};

const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object') return o;
  const id = o.id || o._id || o.orderId || (o.id ? String(o.id) : undefined) || undefined;
  // Always normalize items into an array of simple objects keeping key name/image/price fields
  const rawItems = extractItems(o) || [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map(it => {
    if (!it || typeof it !== 'object') return it;
    const productId = it.productId || it.foodId || it.food?.id || it.id || it._id || null;
    const name = it.name || it.title || (it.food && (it.food.name || it.food.title)) || it.label || undefined;
    const image = it.image || it.img || it.photo || (it.food && (it.food.image || it.food.img)) || undefined;
    const quantity = Number(it.quantity || it.qty || it.count || 1) || 1;
    const unitPrice = Number(it.unitPrice || it.price || it.unit_price || it.amount || 0) || 0;
    const totalPrice = Number(it.totalPrice || it.total || it.amount || (unitPrice * quantity) || 0) || 0;
    const ingredientIds = Array.isArray(it.ingredientIds) ? it.ingredientIds : (Array.isArray(it.ingredients) ? it.ingredients.map(x => (x && (x.id || x)) || x).filter(x => x != null) : undefined);
    // Preserve server-provided nested objects: keep `food` and `ingredients` in the normalized item
    const out = { quantity, unitPrice, totalPrice };
    if (productId) out.productId = productId;
    if (name) out.name = name;
    if (image) out.image = image;
    if (ingredientIds && ingredientIds.length) out.ingredientIds = ingredientIds;
    // merge in nested objects if present so components can access item.food and item.ingredients
    if (it.food && typeof it.food === 'object') out.food = it.food;
    if (Array.isArray(it.ingredients)) out.ingredients = it.ingredients;
    return out;
  });
  // strip nested favorites on customer/user to avoid favorites leaking into orders state
  const cleaned = { ...o };
  // Recursively remove any `favorites` arrays from nested objects so
  // order state never contains favorites data that belongs to auth state.
  const removeFavorites = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    try {
      if (Array.isArray(obj.favorites)) delete obj.favorites;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v && typeof v === 'object') removeFavorites(v);
      }
    } catch (e) { /* ignore */ }
  };

  try { removeFavorites(cleaned); } catch (e) { /* ignore */ }

  return { ...cleaned, id, items };
};
// Extract an array of orders from various backend envelope shapes
const extractOrders = (payload) => {
  if (!payload) return [];
  // Defensive: only accept array-like payloads that look like orders.
  // If payload is an array but contains objects that clearly are not orders
  // (for example, favorite restaurant objects), we return null to signal
  // the caller that the payload is ambiguous and should be ignored.
  if (Array.isArray(payload)) {
    // heuristics: order objects typically contain at least one of these keys
    const likelyOrder = payload.length === 0 || payload.some(p => p && (p.id || p._id || p.orderId || p.items || p.status || p.orderStatus));
    if (likelyOrder) return payload;
    return null; // ambiguous non-order array -> do not overwrite existing orders
  }
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.orders)) return payload.orders;
  if (payload._embedded && Array.isArray(payload._embedded.orders)) return payload._embedded.orders;
  if (payload.data && Array.isArray(payload.data.orders)) return payload.data.orders;

  try {
    const keys = Object.keys(payload || {});
    if (keys.length === 1) {
      const val = payload[keys[0]];
      if (Array.isArray(val)) {
        const likelyOrder = val.length === 0 || val.some(p => p && (p.id || p._id || p.orderId || p.items || p.status || p.orderStatus));
        if (likelyOrder) return val;
        return null;
      }
    }
  } catch (e) {}

  return [];
};

export const orderReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case GET_USERS_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_USERS_ORDERS_SUCCESS: {
      const raw = extractOrders(payload);
      // If payload was ambiguous (null) do not overwrite existing orders
      if (raw === null) {
        if (process.env.NODE_ENV !== 'production') console.warn('GET_USERS_ORDERS_SUCCESS: payload did not look like orders, ignoring');
        return { ...state, loading: false };
      }
      const normalized = raw.map(normalizeOrder);
      // Sort newest first: primary key createdAt desc, fallback to numeric/id desc
      const sorted = normalized.slice().sort((a, b) => {
        const da = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (db !== da) return db - da;
        // fallback: compare id numerically if both numeric-like
        const aid = a && (a.id || a._id || a.orderId);
        const bid = b && (b.id || b._id || b.orderId);
        const an = Number(aid);
        const bn = Number(bid);
        if (Number.isFinite(an) && Number.isFinite(bn)) return bn - an;
        // final fallback: string compare desc
        return String(bid || '').localeCompare(String(aid || ''));
      });
      return {
        ...state,
        error: null,
        loading: false,
        orders: sorted,
      };
    }

    case GET_USERS_ORDERS_FAILURE:
      return {
        ...state,
        error: payload,
        loading: false,
      };
    default:
      return state;
  }
};
