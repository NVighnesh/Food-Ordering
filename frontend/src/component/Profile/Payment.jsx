import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, Typography, Divider, Box, Avatar, Chip } from '@mui/material'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

const LineItem = ({ item, statusLabel, statusColor }) => (
  <div className="flex justify-between items-start py-2">
    <div className="flex items-center gap-3">
      <Avatar src={item.food?.image || ''} variant="square" sx={{ width: 56, height: 56 }} />
      <div>
        <div className="font-medium">{item.food?.name || item.name}</div>
        <div className="text-sm text-gray-400">Qty: {item.quantity || item.qty || 1}</div>
      </div>
    </div>
    <div className="text-right flex flex-col items-end gap-1">
      <div className="font-semibold">₹{(Number(item.totalPrice) || Number(item.price) || 0).toFixed(2)}</div>
      {statusLabel && <Chip size="small" label={statusLabel} color={statusColor} variant="outlined" />}
    </div>
  </div>
)

const PaymentDetails = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state.cart || {});
  const cart = cartState.cart || {};
  const cartItems = cartState.cartItems || [];
  const orderState = useSelector((state) => state.order || {});
  const orders = orderState.orders || [];
  const jwt = localStorage.getItem('jwt');

  useEffect(() => {
    if (jwt) {
      // lazy-load user orders so payment page has up-to-date data
      const { getUsersOrders } = require('../State/Order/Action');
      dispatch(getUsersOrders(jwt));
    }
  }, [dispatch, jwt]);

  // Show all orders, not just the most recent
  const hasOrders = orders && orders.length;
  // If you want to show all orders, use orders; if only the latest, use [orders[0]]
  const displayOrders = hasOrders ? orders : [];

  // Helper to get payment status
  const paidStatuses = new Set(['PAID', 'COMPLETED', 'OUT FOR DELIVERY', 'DELIVERED', 'SUCCESS']);
  const getPaymentStatus = (order) => {
    if (!order) return 'Not paid yet';
    if (order?.isPaid) return 'Paid';
    if (order?.paidAt) return 'Paid';
    if (order?.paymentMethod || order?.payment_mode) return 'Paid';
    if (order?.paymentStatus && String(order.paymentStatus).toLowerCase() === 'paid') return 'Paid';
    if (order?.status && String(order.status).toLowerCase() === 'paid') return 'Paid';
    if (order?.orderStatus && paidStatuses.has(String(order.orderStatus).toUpperCase())) return 'Paid';
    // fallback: if order.total exists and is > 0 and there is no explicit unpaid marker, assume paid
    if (Number(order?.total) > 0 && !(order?.unpaid || order?.isPending)) return 'Paid';
    return 'not yet payment confirmed ';
  };
  const getPaymentColor = (order) => (getPaymentStatus(order) === 'Paid' ? 'success' : 'error');

  // Calculate totals for all items in all orders (or fallback to cart)
  const fallbackItems = (cart && cart.cartItems) ? cart.cartItems : (cartItems || []);
  const allItems = displayOrders.length > 0 ? displayOrders.flatMap(order => order.items || []) : fallbackItems;
  const subtotal = allItems.reduce((s, it) => s + (Number(it.totalPrice) || Number(it.price) || 0), 0);

  // delivery calculation follows Cart.jsx: base === 0 ? 0 : min(99, max(15, round(base * 0.07)))
  const computeDeliveryFee = (base) => (base === 0 ? 0 : Math.min(99, Math.max(15, Math.round(base * 0.07))));
  const delivery = computeDeliveryFee(subtotal);
  // Recompute discount so that (subtotal + delivery - discount) matches summed order totals (if orders exist)
  let discount = 0;
  if (displayOrders.length > 0) {
    const orderGrandTotal = displayOrders.reduce(
      (sum, o) =>
        sum +
        (Number(o.total) ||
          Number(o.totalPrice) ||
          Number(o.amount) ||
          Number(o.grandTotal) ||
          0),
      0
    );

    const currentCalculatedTotal = subtotal + delivery;

    // If our computed total is higher than the orders' grand total, treat the difference as discount.
    // Never use a negative discount (would look like an extra charge).
    const diff = currentCalculatedTotal - orderGrandTotal;
    discount = diff > 0 ? diff : 0;
  } else {
    // Fallback when no orders: keep prior 5% discount behavior
    discount = Number((subtotal * 0.05) || 0);
  }
  // apply 5% discount on total food items (subtotal)
  

  // total is subtotal + delivery - discount
  const total = Number(subtotal + delivery - discount);

  // Prepare item elements: grouped by order when orders exist, otherwise fallback to cart items
  let itemsElements = [];
  if (displayOrders.length > 0) {
    displayOrders.forEach((order) => {
      const statusLabel = getPaymentStatus(order);
      const statusColor = getPaymentColor(order);
      (order.items || []).forEach((it) => {
        const key = `${order.id || 'o'}-${it.id || it.food?.id || Math.random()}`;
        itemsElements.push(
          <LineItem key={key} item={it} statusLabel={statusLabel} statusColor={statusColor} />
        );
      });
    });
  } else {
    itemsElements = fallbackItems.map((it) => (
      <LineItem key={it.id || it.food?.id || Math.random()} item={it} />
    ));
  }


  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto" sx={{ background: '#111827', color: '#fff' }}>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ReceiptLongIcon sx={{ fontSize: 36 }} />
              <div>
                <Typography variant="h6">Payment Summary</Typography>
                <Typography variant="body2" color="text.secondary">Order & payment details</Typography>
              </div>
            </div>
            <div className="text-right">
              {/* Header: removed per-request — payment badge will be shown beside each item below */}
            </div>
          </div>

          <Divider sx={{ my: 2 }} />

          <div className="space-y-2">
            {itemsElements.length === 0 ? (
              <Typography className="text-gray-400">No items to show</Typography>
            ) : (
              itemsElements
            )}
          </div>

          <Divider sx={{ my: 2 }} />

          <Box className="flex justify-end gap-6 flex-col items-end">
            <div className="w-full max-w-sm">
              <div className="flex justify-between py-1"><span className="text-gray-400">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-400">Delivery</span><span>₹{Number(delivery).toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-400">Discount</span><span>-₹{Number(discount).toFixed(2)}</span></div>
              <Divider sx={{ my: 1 }} />
              <div className="flex justify-between py-2 font-semibold text-lg"><span>Total</span><span>₹{Number(total).toFixed(2)}</span></div>
            </div>
          </Box>

          <Divider sx={{ my: 2 }} />

          <div className="flex flex-col gap-2 md:flex-row justify-between items-center">
            <div className="flex items-center gap-3">
              <ShoppingBagIcon />
              <div>
                <div className="font-medium">Payment details</div>
                <div className="text-sm text-gray-400">Includes itemized amounts and payment method</div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">Need help? Contact support@feasto.example</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentDetails
