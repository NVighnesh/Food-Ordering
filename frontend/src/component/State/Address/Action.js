import { api } from "../../config/api";
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

export const createAddress = ({ jwt, data }) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ADDRESS_REQUEST });
    // POST to backend; adjust endpoint if different
  // NOTE: backend uses plural 'users' like other profile endpoints
    const normalizeOutgoing = (d) => {
      if (!d) return d;
      const { streetAddress, street, ...rest } = d;
      return { street: streetAddress ?? street, ...rest };
    };
  const res = await api.post("/api/users/addresses", normalizeOutgoing(data), {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    dispatch({ type: CREATE_ADDRESS_SUCCESS, payload: res.data });
  } catch (error) {
    dispatch({
      type: CREATE_ADDRESS_FAILURE,
      payload: error?.response?.data || error.message,
    });
  }
};

export const getAddresses = ({ jwt }) => async (dispatch) => {
  try {
    dispatch({ type: GET_ADDRESSES_REQUEST });
  const res = await api.get("/api/users/addresses", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    dispatch({ type: GET_ADDRESSES_SUCCESS, payload: res.data });
  } catch (error) {
    dispatch({
      type: GET_ADDRESSES_FAILURE,
      payload: error?.response?.data || error.message,
    });
  }
};

export const selectAddress = (address) => ({
  type: SELECT_ADDRESS,
  payload: address,
});

export const deleteAddress = ({ jwt, id }) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_ADDRESS_REQUEST, payload: id });
    await api.delete(`/api/users/addresses/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    dispatch({ type: DELETE_ADDRESS_SUCCESS, payload: id });
  } catch (error) {
    // If backend returns 409 (conflict) fetch orders to show which orders reference this address
    const status = error?.response?.status;
    const serverMsg = error?.response?.data?.message || error?.response?.data || error.message;
    if (status === 409) {
      let referencingOrders = [];
      try {
        const ordersRes = await api.get('/api/order/user', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const orders = ordersRes?.data || [];
        // Match orders that reference this address by id or by common address fields
        referencingOrders = orders.filter(o => {
          const da = o?.deliveryAddress || {};
          if (!da) return false;
          if (da.id && String(da.id) === String(id)) return true;
          // fallback: compare street/postalCode/city
          const matchFields = ['street', 'streetAddress', 'postalCode', 'city'];
          return matchFields.some(f => da[f] && (da[f] === error?.request?._data?.[f] || false));
        }).map(o => ({ id: o.id, orderStatus: o.orderStatus || o.status || o.order_status, createdAt: o.createdAt || o.created_at }));
      } catch (e) {
        // ignore failures to fetch orders; we'll still return the 409 message
        referencingOrders = [];
      }
      const payload = { message: serverMsg || 'Address cannot be deleted because it is in use', referencingOrders };
      dispatch({ type: DELETE_ADDRESS_FAILURE, payload });
      return payload;
    }
    // default failure path
    dispatch({
      type: DELETE_ADDRESS_FAILURE,
      payload: serverMsg,
    });
  }
};

export const updateAddress = ({ jwt, id, data }) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ADDRESS_REQUEST, payload: { id } });
  const { streetAddress, street, ...rest } = data || {};
  const outgoing = { street: streetAddress ?? street, ...rest };
  const res = await api.put(`/api/users/addresses/${id}`, outgoing, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    dispatch({ type: UPDATE_ADDRESS_SUCCESS, payload: res.data });
  } catch (error) {
    dispatch({
      type: UPDATE_ADDRESS_FAILURE,
      payload: error?.response?.data || error.message,
    });
  }
};