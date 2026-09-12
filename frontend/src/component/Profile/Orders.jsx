import React, { useEffect } from "react";
import OrderCard from "./OrderCard";
import { useDispatch, useSelector } from "react-redux";
import { getUsersOrders } from "../State/Order/Action";

const Orders = () => {
  // select only what we need from the order slice to avoid returning the whole
  // store object (this reduces unnecessary rerenders when unrelated slices
  // like `auth.favorites` update).
  // select only the orders array to avoid re-running when other slices change
  const orders = useSelector((state) => {
    try {
      return (state.order && Array.isArray(state.order.orders)) ? state.order.orders : [];
    } catch (e) { return []; }
  });
  // Prefer the live JWT from Redux so components update immediately when
  // the user logs in. Reading localStorage directly prevents reliable
  // reactivity because localStorage changes don't trigger React effects.
  const dispatch = useDispatch();
  const authJwt = useSelector((state) => state.auth && state.auth.jwt) || null;

  // Fetch orders when we obtain a JWT (login) or when the JWT changes.
  useEffect(() => {
  // Prefer Redux jwt for reactivity, but if it's not ready yet (page refresh)
  // fall back to sessionStorage/localStorage so orders are fetched immediately
  // on mount and items don't vanish until auth is hydrated.
  const token = authJwt || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jwt')) || localStorage.getItem('jwt');
  if (token) dispatch(getUsersOrders(token));
  }, [authJwt, dispatch]);
  
  // Debug: log order slice shape in dev to trace unexpected mutations
  if (process.env.NODE_ENV !== 'production') {
    try { console.debug('Orders count:', orders.length); } catch (e) {}
  }
  // Removed: displayName logic moved to renderOrderSummary

  const ordersList = Array.isArray(orders) ? orders : [];
  const anyOrderHasItems = ordersList.some(o => Array.isArray(o?.items) && o.items.length > 0);

  const renderOrderSummary = (o) => {
    const total = Number(o.totalPrice || 0) || 0;
    const status = o.status || 'unknown';
    const id = o.id;
    const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
    // Use first item's name/title/food.name or fallback
    const firstItem = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null;
    const displayName = firstItem?.name || firstItem?.title || firstItem?.food?.name || 'Unknown Item';
    return (
      <div key={`summary-${id}`} className=" p-4 mb-2 bg-[#e91e63]">
        <div className="flex justify-between items-center">
           <p className='font-medium'>{displayName}</p>
          <div className="text-xs uppercase tracking-wide text-white">{status}</div>
        </div>
        <div className="mt-1 text-xs text-white flex flex-wrap gap-4">
          {created && <span>Placed: {created}</span>}
          <span>Total: ₹{total.toFixed(2)}</span>
          <span>Items: {Array.isArray(o.items) ? o.items.length : 0}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center flex-col">
      <h1 className="text-xl text-center py-7 font-semibold">My Orders</h1>
      <div className="space-y-5 w-full lg:w-1/2">
        {ordersList.length === 0 && (
          <div className="text-center text-gray-500">You have no orders yet.</div>
        )}
        {/* If backend always sends items now, this notice is unnecessary and removed. */}
        {ordersList.map(o => (
          <div key={o.id || Math.random()} className="rounded-md overflow-hidden">
            {renderOrderSummary(o)}
            <div className="divide-y">
              {Array.isArray(o.items) && o.items.map((it, idx) => (
                <OrderCard key={it.id || `${o.id}_${idx}`} order={o} item={it} />
              ))}
              {(!o.items || o.items.length === 0) && (
                <div className="p-4 text-xs text-gray-500">No line items returned for this order.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
