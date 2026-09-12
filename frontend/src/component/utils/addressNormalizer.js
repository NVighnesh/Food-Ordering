// Utility to normalize address objects to support both legacy and canonical field names
// Ensures components can safely access street/streetAddress and state/stateProvince interchangeably.
export function normalizeAddress(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const street = raw.street || raw.streetAddress || '';
  const streetAddress = raw.streetAddress || raw.street || '';
  const state = raw.state || raw.stateProvince || '';
  const stateProvince = raw.stateProvince || raw.state || '';
  return { ...raw, street, streetAddress, state, stateProvince };
}

export function formatAddressLine(addr) {
  const a = normalizeAddress(addr);
  const parts = [a.street || a.streetAddress, a.city, a.state || a.stateProvince, a.postalCode]
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);
  return parts.join(', ');
}
