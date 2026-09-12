import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRestaurantsOrder, updateOrderStatus } from "../../component/State/Restaurant Order/Action";

const orderStatus = [
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Out for Delivery", value: "OUT FOR DELIVERY" },
  { label: "All", value: "ALL" },
];

export default function OrderTable({ filterValue = "ALL" }) {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  // select specific slices only to avoid returning the entire root state
  const restaurant = useSelector((store) => store.restaurant || {});
  const restaurantOrder = useSelector((store) => store.restaurantOrder || { orders: [] });
  // not needed in this component; avoid selecting to reduce rerenders
  // Track which order's menu is open to avoid updating the wrong order due to a shared single anchor
  const [menuState, setMenuState] = React.useState({ anchorEl: null, orderId: null });
  const open = Boolean(menuState.anchorEl);
  const handleOpenMenu = (event, orderId) => {
    setMenuState({ anchorEl: event.currentTarget, orderId });
  };
  const handleClose = () => setMenuState({ anchorEl: null, orderId: null });
  // Refetch whenever filter changes (server-side filtering if supported) else we'll filter client-side
  // compute restaurantId once from the restaurant slice to avoid reruns when
  // unrelated pieces of `restaurant` change (such as favorites nested in user)
  // stabilize dependency: only watch the array length so we don't depend on
  // nested object identity changes
  const firstRestaurantId = restaurant?.usersRestaurants?.[0]?.id || null;
  const restaurantId = React.useMemo(() => firstRestaurantId, [firstRestaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    // Pass orderStatus only if not ALL
    const orderStatus = filterValue === 'ALL' ? undefined : filterValue;
    dispatch(fetchRestaurantsOrder({ jwt, restaurantId, orderStatus }));
  }, [dispatch, jwt, restaurantId, filterValue]);

  // Poll for new orders so the restaurant UI updates when customers place orders.
  // This is a lightweight fallback if the backend doesn't provide websockets/SSE.
  React.useEffect(() => {
    if (!restaurantId) return;
    const orderStatus = filterValue === 'ALL' ? undefined : filterValue;
    const interval = setInterval(() => {
      try {
        dispatch(fetchRestaurantsOrder({ jwt, restaurantId, orderStatus }));
      } catch (e) { /* ignore polling errors */ }
    }, 10000); // poll every 10s
    return () => clearInterval(interval);
    // only depend on dispatch, jwt, restaurantId and filterValue —
    // avoid depending on the whole restaurant object
  }, [dispatch, jwt, restaurantId, filterValue]);
  const handleUpdateOrder = (orderStatus) => {
    if (!menuState.orderId) return handleClose();
    dispatch(updateOrderStatus({ orderId: menuState.orderId, orderStatus, jwt }));
    handleClose();
  };

  // Helper getters to handle multiple possible API shapes
  const getOrderItems = (order) => {
    if (!order) return [];
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.orderItems)) return order.orderItems;
  if (Array.isArray(order.order_items)) return order.order_items;
  if (Array.isArray(order.cartItems)) return order.cartItems;
  if (order.cart && Array.isArray(order.cart.items)) return order.cart.items;
  if (Array.isArray(order.lineItems)) return order.lineItems;
  if (Array.isArray(order.order_lines)) return order.order_lines;
  // sometimes payload wraps items under data/items or _embedded.items
  if (order.data && Array.isArray(order.data.items)) return order.data.items;
  if (order._embedded && Array.isArray(order._embedded.items)) return order._embedded.items;
  // some servers return items under a nested `items` on the single order entry
  if (order.item && Array.isArray(order.item)) return order.item;
  return [];
  };

  const getProductFromOrderItem = (orderItem) => {
    if (!orderItem) return null;
    // Prefer reducer-normalized top-level fields
    if (orderItem.productId || orderItem.name || orderItem.image) return { id: orderItem.productId, name: orderItem.name, image: orderItem.image };
    // Fallback to legacy nested shapes
    return (
      orderItem.food || orderItem.product || orderItem.menu || orderItem.item || orderItem.dish || orderItem.productDetail || orderItem.foods || null
    );
  };

  const getImageForOrderItem = (orderItem) => {
  // If reducer normalized provided an image field use it
  if (orderItem && orderItem.image) return orderItem.image;
  const prod = getProductFromOrderItem(orderItem);
  if (!prod) return undefined;
  if (Array.isArray(prod.images) && prod.images.length) return prod.images[0].url || prod.images[0] || undefined;
  if (prod.image) return prod.image;
  if (prod.photo) return prod.photo;
  if (prod.imageUrl) return prod.imageUrl;
  if (prod.photoUrl) return prod.photoUrl;
  if (Array.isArray(prod.images) && prod.images[0] && typeof prod.images[0] === 'object') return prod.images[0].url || prod.images[0].src || prod.images[0];
  // final deep fallback: search nested objects for any url-like string
  return deepFindImage(orderItem) || deepFindImage(prod) || undefined;
  };

  // Deep fallback: search an object for the first plausible image url-ish string
  const deepFindImage = (obj, seen = new Set()) => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (seen.has(obj)) return undefined;
    seen.add(obj);
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string' && (v.startsWith('http') || v.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i))) return v;
      if (typeof v === 'object') {
        const found = deepFindImage(v, seen);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getNameForOrderItem = (orderItem) => {
  // Prefer normalized name
  if (orderItem && (orderItem.name || orderItem.title || orderItem.label)) return orderItem.name || orderItem.title || orderItem.label;
  const prod = getProductFromOrderItem(orderItem);
  if (!prod) return deepFindName(orderItem) || '';
  return prod.name || prod.title || prod.label || prod.titleText || deepFindName(prod) || '';
  };

  // Deep fallback: search an object for the first plausible name/title string
  const deepFindName = (obj, seen = new Set()) => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (seen.has(obj)) return undefined;
    seen.add(obj);
    // prefer common name-like keys
    const nameKeys = ['name','title','label','titleText','fullName','productName','menuName'];
    for (const k of nameKeys) {
      if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k];
    }
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string' && v.length > 2) return v;
      if (typeof v === 'object') {
        const found = deepFindName(v, seen);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getIngredientsForOrderItem = (orderItem) => {
    if (!orderItem) return [];
  if (Array.isArray(orderItem.ingredients)) return orderItem.ingredients;
  if (Array.isArray(orderItem.toppings)) return orderItem.toppings;
  if (Array.isArray(orderItem.addons)) return orderItem.addons;
  if (Array.isArray(orderItem.ingredientObjects)) return orderItem.ingredientObjects.map(i => i.name || i);
  // some servers return ingredients as objects nested under product
  const prod = getProductFromOrderItem(orderItem);
  if (prod && Array.isArray(prod.ingredients)) return prod.ingredients.map(i => (typeof i === 'object' ? (i.name || i) : i));
  if (prod && Array.isArray(prod.toppings)) return prod.toppings;
  return [];
  };

  const getOrderStatus = (order) => {
    return (
      order.orderStatus || order.status || order.state || order.order_status || order.order_state || ''
    );
  };

  // NOTE: Status updates here are order-level (not per individual line item). If
  // a future requirement emerges to update each line item separately (e.g.
  // mark a single dish as READY while others remain PENDING), we'd extend state
  // to store an items array with its own status field and expose a new action:
  // UPDATE_ORDER_ITEM_STATUS { orderId, itemId, itemStatus }. The reducer would
  // then locate the order by stable string id and immutably map its items,
  // updating only the targeted item. Backend support would also be needed.

  const getCustomerName = (order) => {
    if (!order) return '';
    if (order.customer) return order.customer.fullName || order.customer.name || order.customer.full_name || '';
    if (order.user) return order.user.fullName || order.user.name || order.user.full_name || '';
    return order.customerName || order.name || '';
  };

  const getTotalPrice = (order) => {
    return order.totalPrice || order.total || order.price || order.total_amount || order.amount || '';
  };
  return (
    <Box>
      <Card className="mt-1">
        <CardHeader title={"All Orders"} sx={{ pt: 2, alignItems: "center" }} />
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>id</TableCell>
                <TableCell align="right">image</TableCell>
                <TableCell align="right">Customer</TableCell>
                <TableCell align="right">price</TableCell>
                <TableCell align="right">name</TableCell>
                <TableCell align="right">ingredients</TableCell>
                <TableCell align="right">status</TableCell>
                <TableCell align="right">update</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(restaurantOrder?.orders || [])
                .filter((o) => (filterValue === 'ALL' ? true : getOrderStatus(o) === filterValue))
                .map((item) => (
                <TableRow
                  key={item.id || item.name}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {item.id}
                  </TableCell>
                  <TableCell align="right">
                    <AvatarGroup>
                      {getOrderItems(item).map((orderItem, idx) => (
                        <Avatar
                          key={orderItem.id || orderItem.productId || orderItem.food?.id || orderItem.product?.id || orderItem.food?.name || idx}
                          src={getImageForOrderItem(orderItem)}
                        />
                      ))}
                    </AvatarGroup>
                  </TableCell>
                  <TableCell align="right">{getCustomerName(item)}</TableCell>
                  <TableCell align="right">{getTotalPrice(item)}</TableCell>
                  <TableCell align="right">
                    {getOrderItems(item).map((orderItem, idx) => (
                      <p key={orderItem.id || orderItem.productId || idx}>{getNameForOrderItem(orderItem)}</p>
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    {getOrderItems(item).map((orderItem, oi) => (
                      <div key={orderItem.id || orderItem.productId || oi}>
                        {getIngredientsForOrderItem(orderItem).map((ingredient, ii) => (
                          <Chip key={`${ingredient}-${ii}`} label={ingredient} sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell align="right">{getOrderStatus(item)}</TableCell>
                  <TableCell align="right">
                    <Button
                      aria-haspopup="true"
                      aria-expanded={open && menuState.orderId === item.id ? "true" : undefined}
                      onClick={(e) => handleOpenMenu(e, item.id)}
                    >
                      update
                    </Button>
                    {menuState.orderId === item.id && (
                      <Menu
                        anchorEl={menuState.anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{ list: { 'aria-labelledby': 'update-order-status' } }}
                      >
                        {orderStatus.map((status) => (
                          <MenuItem key={status.value} onClick={() => handleUpdateOrder(status.value)}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
