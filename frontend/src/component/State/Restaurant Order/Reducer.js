import {
  UPDATE_ORDER_STATUS_REQUEST,
  UPDATE_ORDER_STATUS_SUCCESS,
  UPDATE_ORDER_STATUS_FAILURE,
  UPDATE_ORDER_STATUS_OPTIMISTIC,
  GET_RESTAURANTS_ORDER_REQUEST,
  GET_RESTAURANTS_ORDER_SUCCESS,
  GET_RESTAURANTS_ORDER_FAILURE,
} from "./ActionTypes";


const initialState = {
  loading: false,
  error: null,
  orders: [],
};

// helper to extract items from many possible shapes
const extractItems = (o) => {
  if (!o || typeof o !== 'object') return [];
  const candidates = ['items','orderItems','order_items','cartItems','cart_items','lineItems','orderLines','order_lines'];
  for (const k of candidates) {
    if (Array.isArray(o[k])) return o[k];
    if (o[k] && Array.isArray(o[k].items)) return o[k].items; // nested
  }
  if (o.cart && typeof o.cart === 'object') {
    if (Array.isArray(o.cart.items)) return o.cart.items;
    if (Array.isArray(o.cart.cartItems)) return o.cart.cartItems;
  }
  if (Array.isArray(o.cartItems)) return o.cartItems;
  if (Array.isArray(o.order_items)) return o.order_items;
  return [];
};

const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object') return o;
  // Derive a stable string id for all comparisons to avoid mismatching numeric vs string ids.
  const rawId = o.id || o._id || o.orderId || o.order_id;
  const id = rawId != null ? String(rawId) : undefined;
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
  const out = { quantity, unitPrice, totalPrice };
    if (productId) out.productId = productId;
    if (name) out.name = name;
    if (image) out.image = image;
    if (ingredientIds && ingredientIds.length) out.ingredientIds = ingredientIds;
  // Preserve nested objects so UI can render full details when present
  if (it.food && typeof it.food === 'object') out.food = it.food;
  if (Array.isArray(it.ingredients)) out.ingredients = it.ingredients;
  if (Array.isArray(it.images)) out.images = it.images;
  // some APIs nest images under food.images
  if (!out.images && it.food && Array.isArray(it.food.images)) out.images = it.food.images;
    return out;
  });
  // remove favorites nested inside customer/user objects to decouple state
  const cleaned = { ...o };
  // Recursively remove any `favorites` arrays from nested objects so
  // restaurant order state never contains favorites data that belongs to auth state.
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

const restaurantOrderReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_RESTAURANTS_ORDER_REQUEST:
    case UPDATE_ORDER_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_RESTAURANTS_ORDER_SUCCESS: {
      // Defensive normalization: accept several envelope shapes but ignore
      // payloads that clearly don't look like orders (for example, an array
      // of favorite restaurants returned by another endpoint).
      const payload = action.payload;
      const extractArray = (p) => {
        if (!p) return [];
        if (Array.isArray(p)) {
          const likelyOrder = p.length === 0 || p.some(x => x && (x.id || x._id || x.orderId || x.items || x.status || x.orderStatus));
          return likelyOrder ? p : null; // ambiguous non-order array -> signal ignore
        }
        if (Array.isArray(p.content)) return p.content;
        if (Array.isArray(p.orders)) return p.orders;
        if (p._embedded && Array.isArray(p._embedded.orders)) return p._embedded.orders;
        if (p.data && Array.isArray(p.data.orders)) return p.data.orders;
        try {
          const keys = Object.keys(p || {});
          if (keys.length === 1) {
            const val = p[keys[0]];
            if (Array.isArray(val)) {
              const likelyOrder = val.length === 0 || val.some(x => x && (x.id || x._id || x.orderId || x.items || x.status || x.orderStatus));
              return likelyOrder ? val : null;
            }
          }
        } catch (e) {}
        return [];
      };

      const arr = extractArray(payload);
      if (arr === null) {
        if (process.env.NODE_ENV !== 'production') console.warn('GET_RESTAURANTS_ORDER_SUCCESS: payload ambiguous, ignoring');
        return { ...state, loading: false };
      }
      // normalize each order so UI can consistently read `.items`
      const normalized = (Array.isArray(arr) ? arr : []).map(normalizeOrder);
      return {
        ...state,
        loading: false,
        orders: normalized,
      };
    }
    case UPDATE_ORDER_STATUS_OPTIMISTIC: {
      // action.payload: { orderId, orderStatus }
      const { orderId, orderStatus } = action.payload;
      const targetId = orderId != null ? String(orderId) : undefined;
      return {
        ...state,
        orders: state.orders.map((o) =>
          (o && String(o.id) === targetId) ? { ...o, orderStatus } : o
        ),
      };
    }
    case UPDATE_ORDER_STATUS_SUCCESS:
      // Ensure we merge the updated order (backend may return various id field names)
      const payloadId = action.payload && (action.payload.id || action.payload._id || action.payload.orderId || action.payload.order_id);
      const stablePayloadId = payloadId != null ? String(payloadId) : undefined;
      const updatedOrders = state.orders.map((order) =>
        (order && String(order.id) === stablePayloadId)
          ? { ...order, ...action.payload, id: stablePayloadId }
          : order
      );
      return {
        ...state,
        loading: false,
        orders: updatedOrders,
      };
    case GET_RESTAURANTS_ORDER_FAILURE:
    case UPDATE_ORDER_STATUS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    default:
      return state;
  }
};

export default restaurantOrderReducer;
