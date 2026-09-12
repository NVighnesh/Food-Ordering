import {
  UPDATE_ORDER_STATUS_REQUEST,
  UPDATE_ORDER_STATUS_SUCCESS,
  UPDATE_ORDER_STATUS_FAILURE,
  UPDATE_ORDER_STATUS_OPTIMISTIC,
  GET_RESTAURANTS_ORDER_REQUEST,
  GET_RESTAURANTS_ORDER_SUCCESS,
  GET_RESTAURANTS_ORDER_FAILURE,
} from "./ActionTypes";
import { api } from "../../config/api";
import { addLocalNotification } from '../Notification/Action';



export const updateOrderStatus = ({ orderId, orderStatus, jwt }) => {
  return async (dispatch) => {
    try {
      // Immediate optimistic update
      dispatch({
        type: UPDATE_ORDER_STATUS_OPTIMISTIC,
        payload: { orderId, orderStatus },
      });
      dispatch({ type: UPDATE_ORDER_STATUS_REQUEST });
      const response = await api.put(
        `api/admin/order/${orderId}/${orderStatus}`,
        {},

        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
  const updatedOrder = response.data;
  if (process.env.NODE_ENV !== 'production') console.log("Order updated successfully:", updatedOrder);
      dispatch({ type: UPDATE_ORDER_STATUS_SUCCESS, payload: updatedOrder });
      try {
        // notify locally about status change
        dispatch(addLocalNotification({
          type: 'order_status',
          title: `Order ${orderId} ${orderStatus}`,
          body: `Order ${orderId} status changed to ${orderStatus}`,
          data: { orderId, orderStatus },
        }));
  } catch (e) { if (process.env.NODE_ENV !== 'production') console.warn('local notification failed', e); }
    } catch (error) {
      console.error("Error updating order status:", error);
      dispatch({
        type: UPDATE_ORDER_STATUS_FAILURE,
        error,
      });
  // Optionally could refetch orders here to rollback optimistic change
    }
  };
};

export const fetchRestaurantsOrder = ({ restaurantId, orderStatus, jwt }) => {
  return async (dispatch) => {
    try {
      dispatch({ type: GET_RESTAURANTS_ORDER_REQUEST });
      const { data } = await api.get(
        `/api/admin/order/restaurant/${restaurantId}`,
        {
          params: {
            order_status: orderStatus,
          },
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
  let orders = data;
  if (process.env.NODE_ENV !== 'production') console.log("Orders fetched successfully:", orders);

      // Recursively remove any `favorites` arrays nested inside objects so
      // restaurant order state never contains favorites data that belongs to auth state.
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

  // Do not strip nested `favorites` here. Defer removal until after we
  // attempt to recover order-like objects from the raw payload. Some APIs
  // may wrap or mix favorites with orders; removing favorites early would
  // prevent recovery of order objects nested inside them.

      // Normalize payload to an array when possible
      const extractArray = (payload) => {
        if (!payload) return [];
        if (Array.isArray(payload)) {
          // Heuristic: only accept arrays that look like orders. If array
          // contains objects that do not resemble orders (for example
          // favorite restaurant objects), return null to signal ambiguity.
          const likelyOrder = payload.length === 0 || payload.some(p => p && (p.id || p._id || p.orderId || p.items || p.status || p.orderStatus));
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
            if (Array.isArray(val)) return val;
          }
        } catch (e) {}
        return [];
      };

      let ordersArr = extractArray(orders);
      // If extractor returned null then the payload is ambiguous (likely not
      // a direct orders array, e.g. a favorites array). Attempt a best-effort
      // recovery by scanning the payload for nested order-like objects so the
      // restaurant UI can still display order items when the server wraps or
      // mixes data shapes (for example, favorites + orders).
      if (ordersArr === null) {
        // Deep-scan the payload for any order-like objects. This will recurse
        // through arrays/objects and also inspect `favorites` arrays so order
        // objects nested under favorites are recovered.
        const deepCollectOrders = (node, found = [], seen = new Set()) => {
          if (!node || typeof node !== 'object') return found;
          if (seen.has(node)) return found;
          seen.add(node);

          const isOrderLike = (p) => {
            if (!p || typeof p !== 'object') return false;
            const hasItems = Array.isArray(p.items) || Array.isArray(p.orderItems) || Array.isArray(p.order_items) || (p.cart && Array.isArray(p.cart.items));
            const hasOrderId = !!(p.orderId || p.order_id || p._id || p.id);
            const hasStatus = !!(p.status || p.orderStatus || p.order_status);
            return hasItems || hasOrderId || hasStatus;
          };

          if (Array.isArray(node)) {
            for (const el of node) {
              deepCollectOrders(el, found, seen);
            }
            return found;
          }

          // If current object appears to be an order-like object, collect it
          if (isOrderLike(node)) found.push(node);

          // Otherwise, walk its keys and collect from arrays/objects found
          for (const k of Object.keys(node)) {
            try {
              const v = node[k];
              if (!v) continue;
              // Prioritize arrays named 'orders', 'items', or 'favorites'
              if (Array.isArray(v) && (k === 'orders' || k === 'items' || k === 'favorites' || k === 'data' || k === '_embedded')) {
                for (const cand of v) deepCollectOrders(cand, found, seen);
              } else if (typeof v === 'object') {
                deepCollectOrders(v, found, seen);
              }
            } catch (e) { /* ignore */ }
          }
          return found;
        };

        const recovered = deepCollectOrders(orders, []);
        if (recovered && recovered.length) {
          // sanitize recovered orders by removing nested favorites before further processing
          ordersArr = recovered.map(o => (o && typeof o === 'object') ? removeFavorites({ ...o }) : o);
          if (process.env.NODE_ENV !== 'production') console.debug('fetchRestaurantsOrder: recovered orders from ambiguous payload, count=', ordersArr.length);
        } else {
          if (process.env.NODE_ENV !== 'production') console.warn('fetchRestaurantsOrder: response payload ambiguous, not dispatching success');
          dispatch({ type: GET_RESTAURANTS_ORDER_FAILURE, error: 'Ambiguous payload' });
          return;
        }
      }

      // If list endpoint returns minimal orders without items, try to fetch per-order details
      const needsDetails = (ordersArr || []).filter(o => {
        if (!o) return false;
        const hasItems = Array.isArray(o.items) || Array.isArray(o.orderItems) || Array.isArray(o.order_items) || (o.cart && Array.isArray(o.cart.items));
        return !hasItems;
      });

      if (needsDetails.length > 0) {
        const limit = 5;
        const detailed = [];
        const queue = needsDetails.slice();

        // module-scoped probe for admin per-order endpoint availability
        // replace simple boolean with a Promise cache so concurrent callers
        // wait for the same probe instead of issuing multiple HEADs that
        // produce repeated 404s. Value semantics:
        //   undefined = not initialized
        //   Promise<boolean> = pending/resolved probe result
        //   false/true (boolean) for backwards-compat (older sessions)
        if (typeof fetchRestaurantsOrder._detailProbe === 'undefined') fetchRestaurantsOrder._detailProbe = undefined;

        const ensureDetailProbe = async () => {
          // if a boolean was left from older code, use it
          if (fetchRestaurantsOrder._detailProbe === true || fetchRestaurantsOrder._detailProbe === false) return fetchRestaurantsOrder._detailProbe;
          if (fetchRestaurantsOrder._detailProbe) return fetchRestaurantsOrder._detailProbe; // promise in-flight or resolved
          const probeId = (needsDetails[0] && (needsDetails[0].id || needsDetails[0]._id || needsDetails[0].orderId || needsDetails[0].order_id));
          if (!probeId) {
            fetchRestaurantsOrder._detailProbe = Promise.resolve(false);
            return fetchRestaurantsOrder._detailProbe;
          }
          // store a Promise so other callers wait for this probe instead of firing their own
          fetchRestaurantsOrder._detailProbe = (async () => {
            try {
              await api.head(`/api/admin/order/${probeId}`, { headers: { Authorization: `Bearer ${jwt}` } });
              return true;
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') console.debug('Admin order detail endpoint not available, will use public endpoint only', e?.response?.status);
              return false;
            }
          })();
          return fetchRestaurantsOrder._detailProbe;
        };

        const workers = new Array(Math.min(limit, queue.length)).fill(null).map(async () => {
          while (queue.length) {
            const o = queue.shift();
            const id = o && (o.id || o._id || o.orderId || o.order_id);
            if (!id) continue;
            try {
              let res;
              const supported = await ensureDetailProbe();
              if (supported === true) {
                // admin endpoint supported
                try {
                  res = await api.get(`/api/admin/order/${id}`, { headers: { Authorization: `Bearer ${jwt}` } });
                } catch (e) {
                  // if admin call fails unexpectedly, try public endpoint as fallback
                  if (process.env.NODE_ENV !== 'production') console.debug(`Admin detail failed for ${id}, trying public endpoint`, e?.response?.status);
                  res = await api.get(`/api/order/${id}`, { headers: { Authorization: `Bearer ${jwt}` } });
                }
              } else {
                // admin endpoint unsupported — call public endpoint directly
                res = await api.get(`/api/order/${id}`, { headers: { Authorization: `Bearer ${jwt}` } });
              }
              if (res && res.data) detailed.push(res.data);
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') console.debug(`Failed to fetch order ${id}`, e?.message || e);
            }
          }
        });
        try { await Promise.all(workers); } catch (e) { /* ignore */ }

        if (detailed.length > 0) {
          const byId = Object.fromEntries(detailed.map(d => [String(d.id || d._id || d.orderId || d.order_id), d]));
          ordersArr = (ordersArr || []).map(o => {
            const rawId = (o && (o.id || o._id || o.orderId || o.order_id));
            const id = String(rawId || '');
              return byId[id] ? { ...o, ...removeFavorites({ ...byId[id] }) } : o;
          });
          // set orders to merged array so reducer receives items
          orders = ordersArr;
        } else {
          // try to fetch each order using public endpoint as a last resort
          const publicDetailed = [];
          for (const o of needsDetails) {
            const id = o && (o.id || o._id || o.orderId || o.order_id);
            if (!id) continue;
            try {
              const res = await api.get(`/api/order/${id}`);
              if (res && res.data) publicDetailed.push(res.data);
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') console.debug(`Public detail fetch failed for ${id}`, e?.response?.status);
            }
          }
          if (publicDetailed.length > 0) {
            const byId = Object.fromEntries(publicDetailed.map(d => [String(d.id || d._id || d.orderId || d.order_id), d]));
            ordersArr = (ordersArr || []).map(o => {
              const rawId = (o && (o.id || o._id || o.orderId || o.order_id));
              const id = String(rawId || '');
              return byId[id] ? { ...o, ...removeFavorites({ ...byId[id] }) } : o;
            });
            orders = ordersArr;
          }
        }
      }

      // sanitize final payload: remove any non-order objects (e.g. favorites/restaurant items)
      const isOrderLike = (p) => {
        if (!p || typeof p !== 'object') return false;
        const hasItems = Array.isArray(p.items) || Array.isArray(p.orderItems) || Array.isArray(p.order_items) || (p.cart && Array.isArray(p.cart.items));
        const hasCustomer = !!(p.customer || p.user || p.customerName);
        const hasStatus = !!(p.status || p.orderStatus || p.order_status);
        const hasTotal = !!(p.totalPrice || p.total || p.amount || p.total_amount);
        const hasOrderId = !!(p.orderId || p.order_id || p._id || p.id);
        return hasItems || hasCustomer || hasStatus || hasTotal || hasOrderId;
      };
      if (Array.isArray(orders)) {
        // sanitize each order and then filter
        orders = orders.map(o => (o && typeof o === 'object') ? removeFavorites({ ...o }) : o);
        const filtered = orders.filter(isOrderLike);
        if (filtered.length > 0) orders = filtered;
      }

      dispatch({ type: GET_RESTAURANTS_ORDER_SUCCESS, payload: orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      dispatch({
        type: GET_RESTAURANTS_ORDER_FAILURE,
        error,
      });
    }
  };
};
