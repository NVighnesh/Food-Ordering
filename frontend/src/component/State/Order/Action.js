import { api } from "../../config/api";
import { normalizeOrders } from './orderNormalizer';
import { addLocalNotification } from '../Notification/Action';
import { clearCartAction, findCart } from '../Cart/Action';
import {
  CREATE_ORDER_FAILURE,
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  GET_USERS_ORDERS_FAILURE,
  GET_USERS_ORDERS_REQUEST,
  GET_USERS_ORDERS_SUCCESS,
} from "./ActionTypes";

export const createOrder = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_ORDER_REQUEST });
    try {
      if (process.env.NODE_ENV !== 'production') console.log("createOrder payload ->", reqData);
      if (!reqData || !reqData.order) {
        const msg = "createOrder failed: missing order payload";
        console.error(msg, reqData);
        dispatch({ type: CREATE_ORDER_FAILURE, payload: msg });
        return;
      }
      if (!reqData.order.restaurantId) {
        const msg = "createOrder failed: missing restaurantId in order payload";
        console.error(msg, reqData.order);
        dispatch({ type: CREATE_ORDER_FAILURE, payload: msg });
        return;
      }
      const orderPayload = { ...(reqData.order || {}) };
      // defensive: do not attempt to create an order with zero subtotal/items
      const itemsForCalc = orderPayload.items || orderPayload.orderItems || orderPayload.cartItems || [];
      const subtotalCheck = (Array.isArray(itemsForCalc) ? itemsForCalc : []).reduce((s, it) => s + (Number(it.totalPrice || it.unitPrice || it.price || 0) || 0), 0);
      if (!Array.isArray(itemsForCalc) || itemsForCalc.length === 0 || subtotalCheck === 0) {
        const msg = 'createOrder aborted: empty cart or zero subtotal';
        if (process.env.NODE_ENV !== 'production') console.warn(msg, { items: itemsForCalc, subtotalCheck });
        dispatch({ type: CREATE_ORDER_FAILURE, payload: { message: msg } });
        return;
      }
      const items = orderPayload.items || orderPayload.orderItems || orderPayload.order_items || orderPayload.cartItems || [];
      if (!Array.isArray(items) && orderPayload.items && typeof orderPayload.items === 'object') {
        orderPayload.items = Array.isArray(orderPayload.items.items) ? orderPayload.items.items : [];
      }
      const normalizedItems = Array.isArray(orderPayload.items) ? orderPayload.items : (Array.isArray(items) ? items : []);
      const sanitizedItems = (normalizedItems || []).map(it => {
        const productId = it.productId || it.foodId || it.food?.id || it.id || null;
        const name = it.name || it.title || (it.food && (it.food.name || it.food.title)) || undefined;
        const quantity = Number(it.quantity || it.qty || it.count || 1) || 1;
        const unitPrice = Number(it.unitPrice || it.price || it.unit_price || 0) || 0;
        const totalPrice = Number(it.totalPrice || it.total || (unitPrice * quantity) || 0) || 0;
        let ingredientIds = undefined;
        if (Array.isArray(it.ingredientIds)) {
          ingredientIds = it.ingredientIds.map(x => (x && (x.id || x)) || x).filter(x => x != null);
        } else if (Array.isArray(it.ingredients)) {
          ingredientIds = it.ingredients.map(x => (x && (x.id || x)) || x).filter(x => x != null);
        }
        const out = { quantity, unitPrice, totalPrice };
        if (productId) out.productId = productId;
        if (name) out.name = name;
        if (ingredientIds && ingredientIds.length) out.ingredientIds = ingredientIds;
        return out;
      });
      orderPayload.items = sanitizedItems;
      orderPayload.orderItems = sanitizedItems;
      orderPayload.order_items = sanitizedItems;
      orderPayload.cartItems = sanitizedItems;

      // Option A: Provide Stripe line items meta for backend payment session creation.
      // Backend can choose to read stripeLineItems if present; each entry follows
      // Stripe's expected shape (description/name, quantity, unit_amount in smallest currency unit).
      try {
        orderPayload.stripeLineItems = sanitizedItems.map(si => ({
          name: si.name || `Item ${si.productId || ''}`,
          quantity: si.quantity,
          // Convert to smallest currency unit (assuming incoming unitPrice is already in rupees)
          unit_amount: Math.round(Number(si.unitPrice || 0) * 100),
          productId: si.productId
        }));
      } catch (e) { /* ignore stripe meta errors */ }
      if (typeof orderPayload.customerName === 'undefined' || orderPayload.customerName === null) {
        delete orderPayload.customerName;
      }

      if (process.env.NODE_ENV !== 'production') {
        try {
          console.debug('POST /api/order -> payload', orderPayload);
          const debugHeaders = {};
          if (reqData.token) debugHeaders.Authorization = `Bearer ${reqData.token}`;
          console.debug('POST /api/order -> headers', { ...api.defaults.headers, ...debugHeaders });
        } catch (e) { /* ignore debug errors */ }
      }

      const headers = {};
      if (reqData.token) headers.Authorization = `Bearer ${reqData.token}`;
  const { data } = await api.post(`/api/order`, orderPayload, { headers });
      if (data.payment_url) {
        // when payment URL is provided the user is redirected for payment; do not clear local cart yet
        // mark that a payment flow is in progress so unload handlers don't clear auth/localStorage
        try { localStorage.setItem('payment_in_progress', '1'); } catch (e) { /* ignore */ }
        window.location.href = data.payment_url;
      } else {
          // Try to clear server-side cart first. Regardless of server result, ensure local client cart is cleared
          // to avoid stale items in the UI. Use sessionStorage/localStorage to find the token if reqData doesn't provide it.
          const jwtTok = (reqData && (reqData.token || reqData.jwt)) || sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
          try {
            // best-effort: clear server cart using explicit token
            await dispatch(clearCartAction(jwtTok));
            // re-fetch cart from server so client state exactly matches the server-cleared cart
            try { await dispatch(findCart(jwtTok)); } catch (e) { if (process.env.NODE_ENV !== 'production') console.warn('findCart after clear failed', e); }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.warn('Server-side clearCartAction failed', e);
          }
        try {
          // Always clear local cart state and persisted localStorage to avoid stale UI
          dispatch({ type: 'CLEAR_LOCAL_CART' });
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.warn('CLEAR_LOCAL_CART dispatch failed', e);
        }
      }
      if (process.env.NODE_ENV !== 'production') console.log("create order data", data);
  dispatch({ type: CREATE_ORDER_SUCCESS, payload: data });
      // Persist a snapshot of the items used to create this order so that
      // if the backend returns the order without items (lazy loading issue),
      // the UI can still display them locally. This is a stop-gap until the
      // backend serves items eagerly or via DTO.
      try {
        if (data && (data.id || data._id) && Array.isArray(sanitizedItems)) {
          const oid = data.id || data._id;
          localStorage.setItem('order_items_' + oid, JSON.stringify(sanitizedItems));
        }
      } catch (e) { /* ignore */ }
      // Refresh user's orders list and cart so UI updates immediately
      try {
        const jwtTok = (reqData && (reqData.token || reqData.jwt)) || sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
        if (jwtTok) await dispatch(getUsersOrders(jwtTok));
        try { await dispatch(findCart(jwtTok)); } catch (e) { /* best-effort */ }
      } catch (e) { if (process.env.NODE_ENV !== 'production') console.warn('post-createOrder refresh failed', e); }
      try {
        dispatch(addLocalNotification({
          type: 'order_placed',
          title: `Order placed (#${data.id || data._id || ''})`,
          body: `Your order was placed successfully.`,
          data: { orderId: data.id || data._id },
        }));
      } catch (e) { if (process.env.NODE_ENV !== 'production') console.warn('local notification failed', e); }
    } catch (error) {
      const status = error?.response?.status;
      const respData = error?.response?.data;
      const message = error?.message || (respData && respData.message) || 'createOrder failed';
      if (process.env.NODE_ENV !== 'production') {
        console.error('createOrder failed ->', { status, message, response: respData, error });
      } else {
        console.error('createOrder failed ->', message);
      }
      const payload = { status, data: respData, message };
      dispatch({ type: CREATE_ORDER_FAILURE, payload });
      // Attempt to refresh cart from server so UI reflects server state even when order fails
      try {
        if (reqData && reqData.token) await dispatch(findCart(reqData.token));
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('findCart after createOrder failure failed', e);
      }
    }
  };
};

export const getUsersOrders = (jwt) => {
  return async (dispatch) => {
    dispatch({ type: GET_USERS_ORDERS_REQUEST });
    try {
      const { data } = await api.get(`/api/order/user`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (process.env.NODE_ENV !== 'production') console.log("get users orders data", data);

      const extractOrders = (payload) => {
        if (!payload) return [];
        const isOrderLike = (p) => {
          if (!p || typeof p !== 'object') return false;
          const hasItems = Array.isArray(p.items) || Array.isArray(p.orderItems) || Array.isArray(p.order_items) || (p.cart && Array.isArray(p.cart.items));
          const hasCustomer = !!(p.customer || p.user || p.customerName);
          const hasStatus = !!(p.status || p.orderStatus || p.order_status);
          const hasTotal = !!(p.totalPrice || p.total || p.amount || p.total_amount);
          const hasOrderId = !!(p.orderId || p.order_id || p._id || p.id);
          return hasItems || hasCustomer || hasStatus || hasTotal || hasOrderId;
        };
        if (Array.isArray(payload)) {
          const likelyOrder = payload.length === 0 || payload.some(p => isOrderLike(p));
          return likelyOrder ? payload : null;
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
              const likelyOrder = val.length === 0 || val.some(p => isOrderLike(p));
              return likelyOrder ? val : null;
            }
          }
        } catch (e) {}
        return [];
      };

      // Recursively remove any `favorites` arrays nested inside objects so
      // auth favorites never leak into order objects stored in Redux.
      const removeFavorites = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        try {
          if (Array.isArray(obj.favorites)) delete obj.favorites;
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (v && typeof v === 'object') removeFavorites(v);
          }
        } catch (e) { /* ignore */ }
        return obj;
      };

  let orders = extractOrders(data);
      if (Array.isArray(orders)) orders = orders.map(o => (o && typeof o === 'object') ? removeFavorites({ ...o }) : o);
      if (orders === null) {
        if (process.env.NODE_ENV !== 'production') console.warn('getUsersOrders: response payload ambiguous, aborting update to orders');
        try {
          const cacheKey = 'cachedOrders_v1';
          const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]') || [];
          if (cached && cached.length) {
            dispatch({ type: GET_USERS_ORDERS_SUCCESS, payload: cached });
          } else {
            dispatch({ type: GET_USERS_ORDERS_FAILURE, payload: 'Ambiguous payload' });
          }
        } catch (e) {
          dispatch({ type: GET_USERS_ORDERS_FAILURE, payload: 'Ambiguous payload' });
        }
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        try { console.debug('getUsersOrders first order sample:', orders && orders[0]); } catch (e) {}
      }

      const needsDetails = (orders || []).filter(o => {
        if (!o) return false;
        const hasItems = Array.isArray(o.items) || Array.isArray(o.orderItems) || Array.isArray(o.order_items) || (o.cart && Array.isArray(o.cart.items));
        return !hasItems;
      });

      if (needsDetails.length > 0) {
        if (typeof getUsersOrders._detailProbe === 'undefined') getUsersOrders._detailProbe = undefined;
        const ensureProbe = async () => {
          // Allow re-probing if the cached probe result is stale (5 minutes)
          const STALE_MS = 5 * 60 * 1000;
          if (typeof getUsersOrders._detailProbeTime === 'number' && typeof getUsersOrders._detailProbe === 'boolean') {
            const age = Date.now() - getUsersOrders._detailProbeTime;
            if (age < STALE_MS) {
              if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: using cached detailProbe=', getUsersOrders._detailProbe, 'age(ms)=', age);
              return getUsersOrders._detailProbe;
            }
            // stale -> reset and re-probe
            if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: detailProbe cache stale, re-probing');
            getUsersOrders._detailProbe = undefined;
            getUsersOrders._detailProbeTime = undefined;
          }
          if (getUsersOrders._detailProbe === true || getUsersOrders._detailProbe === false) return getUsersOrders._detailProbe;
          if (getUsersOrders._detailProbe) return getUsersOrders._detailProbe;
          const probeId = (needsDetails[0] && (needsDetails[0].id || needsDetails[0]._id || needsDetails[0].orderId));
          if (!probeId) {
            getUsersOrders._detailProbe = Promise.resolve(false);
            return getUsersOrders._detailProbe;
          }
          // Use GET probe instead of HEAD: some backends disallow HEAD while
          // allowing GET for the same resource. If GET succeeds the detail
          // endpoint is available and we can fetch per-order details.
          getUsersOrders._detailProbe = (async () => {
            try {
              if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: probing detail endpoint GET /api/order/' + probeId);
              const res = await api.get(`/api/order/${probeId}`, { headers: { Authorization: `Bearer ${jwt}` } });
              if (res && typeof res.data !== 'undefined') {
                if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: detail probe ok for id', probeId);
                return true;
              }
              if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: detail probe returned no body for id', probeId);
              return false;
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') console.debug('Detail endpoint probe failed, disabling per-order fetches', e?.response?.status);
              return false;
            } finally {
              try { getUsersOrders._detailProbeTime = Date.now(); } catch (e) { /* ignore */ }
            }
          })();
          return getUsersOrders._detailProbe;
        };

        const supported = await ensureProbe();
        if (supported === true) {
          const limit = 5;
          const detailed = [];
          const queue = needsDetails.slice();
          const workers = new Array(Math.min(limit, queue.length)).fill(null).map(async () => {
            while (queue.length) {
              const o = queue.shift();
              const id = o && (o.id || o._id || o.orderId);
              if (!id) continue;
              try {
                try {
                  if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: fetching order details for', id);
                  const res = await api.get(`/api/order/${id}`, { headers: { Authorization: `Bearer ${jwt}` } });
                  if (res && res.data) {
                    detailed.push(res.data);
                    if (process.env.NODE_ENV !== 'production') console.debug('getUsersOrders: fetched details for', id, res.data);
                  }
                } catch (e) {
                  if (process.env.NODE_ENV !== 'production') console.debug(`Failed to fetch order ${id}`, e?.response?.status || e?.message || e);
                }
              } catch (e) {
                if (process.env.NODE_ENV !== 'production') console.debug(`Failed to fetch order ${id}`, e?.message || e);
              }
            }
          });
          try { await Promise.all(workers); } catch (e) { /* ignore */ }
          if (detailed.length > 0) {
            const byId = Object.fromEntries(detailed.map(d => [String(d.id || d._id || d.orderId), d]));
            orders = (orders || []).map(o => (byId[String(o.id || o._id || o.orderId)] || o));
          }
        }
      }

      try {
        const key = 'knownOrderStatuses_v1';
        const raw = localStorage.getItem(key) || '{}';
        const known = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const changed = [];
        (orders || []).forEach(o => {
          const id = o.id || o._id || o.orderId;
          if (!id) return;
          const status = o.status || o.orderStatus || o.order_status || o.state || null;
          const prev = known[String(id)];
          if (!prev) {
            changed.push({ id, status, kind: 'new' });
          } else if (prev !== status) {
            changed.push({ id, status, kind: 'status' });
          }
          known[String(id)] = status;
        });
        localStorage.setItem(key, JSON.stringify(known));
        changed.forEach(c => {
          try {
            if (c.kind === 'new') {
              dispatch(addLocalNotification({ type: 'order_placed', title: `Order placed (#${c.id})`, body: `Your order was placed successfully.`, data: { orderId: c.id } }));
            } else {
              dispatch(addLocalNotification({ type: 'order_status', title: `Order ${c.id} updated`, body: `Order ${c.id} status: ${c.status}`, data: { orderId: c.id, orderStatus: c.status } }));
            }
          } catch (e) { if (process.env.NODE_ENV !== 'production') console.warn('notify order change failed', e); }
        });
      } catch (e) { /* ignore parse errors */ }

      try {
  const cacheKey = 'cachedOrders_v1';
        let cached = [];
        try { cached = JSON.parse(localStorage.getItem(cacheKey) || '[]') || []; } catch (e) { cached = []; }
        const byId = {};
        (Array.isArray(cached) ? cached : []).forEach(o => {
          const id = String((o && (o.id || o._id || o.orderId)) || '');
          if (id) byId[id] = o;
        });
        (Array.isArray(orders) ? orders : []).forEach(o => {
          const id = String((o && (o.id || o._id || o.orderId)) || '');
          if (id) byId[id] = { ...(byId[id] || {}), ...(o && typeof o === 'object' ? removeFavorites({ ...o }) : o) };
        });
        const merged = Object.values(byId);
        try { localStorage.setItem(cacheKey, JSON.stringify(merged)); } catch (e) { /* ignore */ }
        const isOrderLikeFinal = (p) => {
          if (!p || typeof p !== 'object') return false;
          const hasItems = Array.isArray(p.items) || Array.isArray(p.orderItems) || Array.isArray(p.order_items) || (p.cart && Array.isArray(p.cart.items));
          const hasCustomer = !!(p.customer || p.user || p.customerName);
          const hasStatus = !!(p.status || p.orderStatus || p.order_status);
          const hasTotal = !!(p.totalPrice || p.total || p.amount || p.total_amount);
          const hasOrderId = !!(p.orderId || p.order_id || p._id || p.id);
          return hasItems || hasCustomer || hasStatus || hasTotal || hasOrderId;
        };
  const finalMerged = Array.isArray(merged) ? merged.filter(isOrderLikeFinal) : merged;
  const sanitizedFinal = Array.isArray(finalMerged) ? finalMerged.map(o => (o && typeof o === 'object') ? removeFavorites({ ...o }) : o) : finalMerged;
  // Option B: Normalize final list (DTO normalization) so UI can rely on stable shape.
  let normalized = [];
  try { normalized = normalizeOrders(sanitizedFinal); } catch (e) { normalized = sanitizedFinal; }
  dispatch({ type: GET_USERS_ORDERS_SUCCESS, payload: normalized });
      } catch (e) {
        dispatch({ type: GET_USERS_ORDERS_SUCCESS, payload: orders });
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      dispatch({ type: GET_USERS_ORDERS_FAILURE, payload: error });
    }
  };
};
  // file end
