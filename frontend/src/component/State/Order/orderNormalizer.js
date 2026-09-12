// Order Normalizer Utility (Option B - DTO Normalization)
// This utility converts any legacy or DTO order shape coming from the backend
// into a consistent structure the UI can rely on:
// {
//   id: string|number,
//   status: string|null,
//   totalPrice: number,
//   createdAt: string|Date|undefined,
//   items: [ { id, productId, name, quantity, unitPrice, totalPrice, imageUrl } ]
// }
// It is intentionally defensive so we can safely remove legacy fallback logic
// later once the backend always returns a proper DTO.

export function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id || raw._id || raw.orderId || raw.order_id || null;
  const status = raw.status || raw.orderStatus || raw.order_status || raw.state || null;
  const totalPrice = numberish(
    raw.totalPrice || raw.totalAmount || raw.total || raw.amount || raw.total_amount || 0
  );
  const createdAt = raw.createdAt || raw.created_at || raw.createdDate || raw.date || raw.createdOn;

  // Prefer explicit array fields in order: items (DTO) -> orderItems -> order_items -> legacy cart nesting
  let items = raw.items || raw.orderItems || raw.order_items || (raw.cart && raw.cart.items) || [];
  if (!Array.isArray(items)) items = [];

  const normItems = items.map((it, idx) => normalizeItem(it, idx, id));

  return {
    ...raw, // retain any extra fields for now (backwards compatibility)
    id,
    status,
    totalPrice,
    createdAt,
    items: normItems,
  };
}

export function normalizeItem(it, idx = 0, orderId = null) {
  if (!it || typeof it !== 'object') return null;
  const productId = it.productId || it.foodId || (it.food && it.food.id) || it.id || null;
  const name = it.name || it.title || (it.food && (it.food.name || it.food.title)) || `Item ${idx + 1}`;
  const quantity = numberish(it.quantity || it.qty || it.count || 1, 1);
  const unitPrice = numberish(it.unitPrice || it.price || (it.food && it.food.price) || 0);
  // If totalPrice missing compute fallback
  const totalPrice = numberish(it.totalPrice || it.total || (unitPrice * quantity));
  const images = Array.isArray(it.images) ? it.images : (it.food && Array.isArray(it.food.images) ? it.food.images : []);
  let image = images && images.length ? images[0] : (it.image || it.photo || (it.food && (it.food.image || it.food.photo)) || null);
  if (image && typeof image === 'object') {
    // handle potential object with url prop
    image = image.url || image.src || null;
  }
  return {
    ...it,
    id: it.id || `${orderId || 'o'}_${productId || 'p'}_${idx}`,
    orderId,
    productId,
    name,
    quantity,
    unitPrice,
    totalPrice,
    imageUrl: image || null,
  };
}

function numberish(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Normalizes an array defensively (ignores null entries).
export function normalizeOrders(list) {
  return (Array.isArray(list) ? list : []).map(o => normalizeOrder(o)).filter(Boolean);
}
