import { Avatar, Badge, Box, IconButton, InputBase, Paper, ListItem, ListItemText, ListItemButton, CircularProgress, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import KitchenIcon from '@mui/icons-material/Kitchen'
import { pink } from "@mui/material/colors";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FoodBankIcon from '@mui/icons-material/FoodBank'
import NotificationsDropdown from './NotificationsDropdown'
import { api } from '../config/api';
import "./Navbar.css";
import { Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export const Navbar = () => {
  const auth = useSelector((state) => state.auth) || {};
  const cart = useSelector((state) => state.cart) || {};
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [openResults, setOpenResults] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  // run the search side-effect
  useGlobalSearch(query, setResults, setLoadingSearch, auth.user);

  const handleAvatarClick = () => {
    // Redirect owners explicitly to admin area. All other users (customers, guests)
    // should go to the public profile page. Use absolute paths to avoid relative
    // navigation surprises when current location is nested.
    if (auth.user?.role === 'ROLE_RESTAURANT_OWNER') {
      navigate('/admin/restaurants');
      return;
    }
    navigate('/my-profile');
  };
  // compute avatar initial safely
  const avatarInitial = (() => {
    try {
      const name = auth?.user?.fullName || auth?.user?.name || '';
      return (name && name.length > 0) ? name[0].toUpperCase() : 'U';
    } catch (e) { return 'U'; }
  })();
  return (
    <Box className="px-5 fixed top-0 left-0 right-0 z-50 h-16 bg-[#e91e63] lg:px-20 flex items-center justify-between">
      <div className="lg:mr-10 cursor-pointer flex items-center space-x-4">
        <IconButton onClick={() => navigate('/')} sx={{ color: 'white' }}>
          <KitchenIcon />
        </IconButton>
        <li onClick={() => navigate("/")} className="logo font-semibold text-gray-300 text-2xl">
          Feasto Food
        </li>
      </div>
      <div className="flex items-center space-x-2 lg:space-x-10">
        <div className="">
          <Paper component="form" sx={{ display: 'flex', alignItems: 'center', width: { xs: 180, sm: 300 } }} onSubmit={(e)=>e.preventDefault()}>
            <InputBase
              sx={{ ml: 1, flex: 1, color: 'white' }}
              placeholder="Search"
              inputProps={{ 'aria-label': 'search' }}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value && e.target.value.trim().length > 0) setOpenResults(true);
                else setOpenResults(false);
              }}
              onFocus={() => { if (query && query.trim().length>0) setOpenResults(true); }}
            />
            <IconButton sx={{ p: '10px', color: 'white' }} aria-label="search" onClick={() => { if (query && query.trim().length>0) setOpenResults(true); }}>
              <SearchIcon />
            </IconButton>
          </Paper>
          {/* results dropdown */}
          {openResults && (
            <Box sx={{ position: 'absolute', mt: 8, width: { xs: 220, sm: 360 }, right: 24, zIndex: 60 }}>
              <Paper sx={{ maxHeight: 360, overflow: 'auto' }}>
                {loadingSearch ? <Box sx={{ display: 'flex', justifyContent: 'center', p:2 }}><CircularProgress size={20} /></Box> : (
                  <Box>
                    {/* Items section */}
                    <Box sx={{ px:1, pt:1 }}>
                      <Box sx={{ fontSize: 12, color: 'text.secondary', px:1 }}>Items</Box>
                      {results.filter(r => r.type === 'food').length === 0 && <ListItem><ListItemText primary="No items" /></ListItem>}
                      {results.filter(r => r.type === 'food').map(r => (
                        <ListItem key={`food-${r.id}`} disablePadding>
                          <ListItemButton onClick={() => { setOpenResults(false); const restId = r.data?.restaurantId || r.data?.restaurant?.id || r.data?.restaurant; if (restId) { const city = (r.data?.restaurant?.address?.city) || 'unknown'; const title = (r.data?.restaurant?.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); navigate(`/restaurant/${encodeURIComponent(city)}/${encodeURIComponent(title)}/${restId}`, { state: { highlightItemId: r.id } }); } else { navigate('/'); } }}>
                            {r.thumb ? <img src={r.thumb} style={{ width: 48, height: 48, objectFit: 'cover', marginRight: 8 }} alt="" /> : null}
                            <ListItemText primary={r.title} secondary={r.subtitle} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </Box>
                    <Divider />
                    {/* Restaurants section */}
                    <Box sx={{ px:1, pt:1 }}>
                      <Box sx={{ fontSize: 12, color: 'text.secondary', px:1 }}>Restaurants</Box>
                      {results.filter(r => r.type === 'restaurant').length === 0 && <ListItem><ListItemText primary="No restaurants" /></ListItem>}
                      {results.filter(r => r.type === 'restaurant').map(r => (
                        <ListItem key={`rest-${r.id}`} disablePadding>
                          <ListItemButton onClick={() => { setOpenResults(false); const city = (r.data && (r.data.address?.city || r.data.city)) || 'unknown'; const title = (r.title || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); navigate(`/restaurant/${encodeURIComponent(city)}/${encodeURIComponent(title)}/${r.id}`); }}>
                            {r.thumb ? <img src={r.thumb} style={{ width: 48, height: 48, objectFit: 'cover', marginRight: 8 }} alt="" /> : null}
                            <ListItemText primary={r.title} secondary={r.subtitle} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </div>
        {/* food-bank icon: navigates to profile (sidebar) */}
        <div className="">
          <IconButton onClick={() => navigate('/my-profile/orders')}>
            <FoodBankIcon sx={{ fontSize: '1.5rem', color: 'white' }} />
          </IconButton>
        </div>
        <div className="">
          <NotificationsDropdown />
        </div>
        <div className="">
          <IconButton onClick={() => navigate("/cart") }>
            <Badge color="primary" badgeContent={(cart && Array.isArray(cart.cartItems)) ? cart.cartItems.length : 0}>
              <ShoppingCartIcon sx={{ fontSize: "1.5rem" }} />
            </Badge>
          </IconButton>
        </div>
        <div className="">
          {auth.user ? (
            <Avatar onClick={handleAvatarClick} sx={{ bgcolor: "white", color: pink.A400 }}>
              {avatarInitial}
            </Avatar>
          ) : (
            <IconButton onClick={() => navigate("/account/login")}>
              <Person />
            </IconButton>
          )}
        </div>
      </div>
    </Box>
  );
};

// perform search side-effect
function useGlobalSearch(query, setResults, setLoading, currentUser) {
  useEffect(() => {
    if (!query || query.trim().length === 0) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const q = encodeURIComponent(query.trim());
    // call the authoritative food search endpoint (requires 'name') and restaurants in parallel
    Promise.allSettled([
      api.get(`/api/food/search?name=${q}&page=0&size=6`),
      api.get(`/api/restaurants/search?keyword=${q}&page=0&size=6`),
  ]).then(async (res) => {
      if (cancelled) return;
      setLoading(false);
      // foods: Page<FoodDto> or array
      let foodsRaw = (res[0].status === 'fulfilled' && res[0].value && res[0].value.data) ? res[0].value.data : null;
      let foods = Array.isArray(foodsRaw) ? foodsRaw : (foodsRaw && Array.isArray(foodsRaw.content) ? foodsRaw.content : []);

      // If no global foods found, and we're currently viewing a restaurant page, try fetching that restaurant's menu and filter locally
      try {
        if ((!foods || foods.length === 0)) {
          // detect restaurant id from URL: expecting /restaurant/:city/:title/:id
          const path = window.location.pathname || '';
          const parts = path.split('/').filter(Boolean);
          const restIndex = parts.indexOf('restaurant');
          const maybeId = restIndex >= 0 && parts.length > restIndex + 3 ? parts[restIndex + 3] : (restIndex >=0 && parts.length > restIndex + 1 ? parts[parts.length -1] : null);
          const restId = maybeId && !isNaN(Number(maybeId)) ? Number(maybeId) : maybeId;
          if (restId) {
            try {
              const menuResp = await api.get(`/api/food/restaurant/${restId}?page=0&size=200`);
              const menuData = menuResp && menuResp.data ? menuResp.data : null;
              const menuItems = Array.isArray(menuData) ? menuData : (menuData && Array.isArray(menuData.content) ? menuData.content : []);
              if (menuItems && menuItems.length > 0) {
                const qRaw = decodeURIComponent(q).toLowerCase();
                const filtered = menuItems.filter(mi => {
                  const name = (mi.name || mi.title || '').toString().toLowerCase();
                  return name.includes(qRaw);
                });
                if (filtered.length > 0) foods = filtered;
              }
            } catch (e) {
              // ignore menu fetch errors
            }
          }
        }
      } catch (e) {
        // ignore
      }

      // restaurants: Page<RestaurantDto> or array
      let restsRaw = (res[1].status === 'fulfilled' && res[1].value && res[1].value.data) ? res[1].value.data : null;
      const restaurants = Array.isArray(restsRaw) ? restsRaw : (restsRaw && Array.isArray(restsRaw.content) ? restsRaw.content : []);

      // If both foods and restaurants are empty, try fetching a short list of restaurants
      // (fallback) and probe their menus to find matching items locally. This handles
      // cases where the search endpoints return no results for multi-character queries
      // but the items exist in restaurant menus.
      try {
        if ((!foods || foods.length === 0) && (!Array.isArray(restaurants) || restaurants.length === 0)) {
          const restListResp = await api.get(`/api/restaurants?page=0&size=6`).catch(() => null);
          const restListRaw = restListResp && restListResp.data ? restListResp.data : null;
          const restList = Array.isArray(restListRaw) ? restListRaw : (restListRaw && Array.isArray(restListRaw.content) ? restListRaw.content : []);
          if (Array.isArray(restList) && restList.length > 0) {
            const menuPromises = restList.slice(0, 6).map(r => api.get(`/api/food/restaurant/${r.id}?page=0&size=50`).catch(() => null));
            const menuResults = await Promise.all(menuPromises);
            const qRaw = decodeURIComponent(q).toLowerCase();
            const found = [];
            for (const mr of menuResults) {
              if (!mr || !mr.data) continue;
              const md = mr.data;
              const items = Array.isArray(md) ? md : (md && Array.isArray(md.content) ? md.content : []);
              for (const mi of items) {
                const name = (mi.name || mi.title || '').toString().toLowerCase();
                if (name.includes(qRaw)) {
                  found.push(mi);
                }
              }
            }
            if (found.length > 0) {
              const seen = new Set();
              const dedup = [];
              for (const it of found) {
                const id = it.id || it._id || it.foodId;
                if (!seen.has(id)) { seen.add(id); dedup.push(it); }
              }
              foods = dedup;
            }
          }
        }
      } catch (e) {
        // ignore fallback errors
      }

      // If still no foods found, but restaurants were returned (home page), probe the first few restaurants' menus and filter locally
      try {
        if ((!foods || foods.length === 0) && Array.isArray(restaurants) && restaurants.length > 0) {
          const maxProbe = 6;
          const toProbe = restaurants.slice(0, maxProbe);
          const menuPromises = toProbe.map(r => api.get(`/api/food/restaurant/${r.id}?page=0&size=50`).catch(() => null));
          const menuResults = await Promise.all(menuPromises);
          const qRaw = decodeURIComponent(q).toLowerCase();
          const found = [];
          for (const mr of menuResults) {
            if (!mr || !mr.data) continue;
            const md = mr.data;
            const items = Array.isArray(md) ? md : (md && Array.isArray(md.content) ? md.content : []);
            for (const mi of items) {
              const name = (mi.name || mi.title || '').toString().toLowerCase();
              if (name.includes(qRaw)) {
                found.push(mi);
              }
            }
          }
          if (found.length > 0) {
            // dedupe by id
            const seen = new Set();
            const dedup = [];
            for (const it of found) {
              const id = it.id || it._id || it.foodId;
              if (!seen.has(id)) { seen.add(id); dedup.push(it); }
            }
            foods = dedup;
          }
        }
      } catch (e) {
        // ignore probe errors
      }

      const mappedFoods = (foods || []).map(f => ({
        type: 'food',
        id: f.id || f._id || f.foodId,
        title: f.name,
        subtitle: f.category?.name || f.foodCategory?.name || (f.restaurantName || ''),
        thumb: Array.isArray(f.images) ? f.images[0] : (f.image || ''),
        data: f,
      }));

      const mappedRests = (restaurants || []).map(r => ({
        type: 'restaurant',
        id: r.id || r._id,
        title: r.title || r.name,
        subtitle: r.description || r.cuisineType || r.address?.city || '',
        thumb: Array.isArray(r.images) ? r.images[0] : (r.image || ''),
        data: r,
      }));

      setResults([...mappedFoods, ...mappedRests]);
    }).catch(err => {
      if (cancelled) return;
      setLoading(false);
      setResults([]);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; }; // Cleanup: set cancelled to true on unmount or dependency change
  }, [query, setResults, setLoading, currentUser]); // Add currentUser to dependencies
}
