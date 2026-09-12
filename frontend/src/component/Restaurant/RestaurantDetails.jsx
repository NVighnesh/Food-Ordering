import {
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MenuCard from "./MenuCard";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getRestaurantByID,
  getRestaurantsCategory,
} from "../State/Restaurant/Action";
import { getErrorMessage, isConstraintViolation } from "../config/errorHandler";
import { getMenuItemsByRestaurantId } from "../State/Menu/Action";
import { normalizeAddress } from "../utils/addressNormalizer";

const foodTypes = [
  { label: "All", value: "all" },
  { label: "Vegetarian only", value: "vegetarian" },
  { label: "Non-vegetarian", value: "nonveg" },
  { label: "Seasonal", value: "seasonal" },
];

const RestaurantDetails = () => {
  const [foodType, setFoodType] = useState("all");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  // Use correct selector for restaurant and categories

  const restaurant = useSelector((state) => state.restaurant) || {};
  const menuItemsRaw = useSelector((state) => (state.menu && state.menu.menuItems) ? state.menu.menuItems : []);
  const menuItems = React.useMemo(() => menuItemsRaw || [], [menuItemsRaw]);
  const categories = React.useMemo(() => (restaurant.categories || []), [restaurant.categories]);
  // local categories list with fallback derived from menuItems
  const [categoriesList, setCategoriesList] = useState(categories);
  const restaurantData =
    restaurant && restaurant.restaurant ? restaurant.restaurant : {};
    const [selectedCategory, setSelectedCategory] = useState("");

  // Client-side fallback filter: apply both foodType and category filters
  const matchesCategory = (mi) => {
    if (!selectedCategory) return true;
    // Try object forms first
    const cat = mi.category ?? mi.foodCategory ?? mi.food_category;
    if (cat) {
      if (typeof cat === "string") return String(cat) === String(selectedCategory);
      const catId = cat.id ?? cat._id ?? cat.categoryId;
      const catName = cat.name ?? cat.title;
      if ((catId !== undefined && String(catId) === String(selectedCategory)) ||
          (catName !== undefined && String(catName) === String(selectedCategory))) return true;
    }
    // Fallback: some payloads may only include an id field without nested object
    const directId = mi.foodCategoryId ?? mi.categoryId ?? mi.food_category_id ?? mi.food_categoryId;
    if (directId !== undefined && directId !== null) {
      return String(directId) === String(selectedCategory);
    }
    return false;
  };

  const matchesFoodType = (mi) => {
    if (!foodType || foodType === "all") return true;
    const isVegetarian = mi.vegetarian ?? mi.isVegetarian ?? mi.veg ?? false;
    const isNonVeg = mi.nonveg ?? mi.isNonVeg ?? mi.nonVegetarian ?? (!isVegetarian && (mi.nonveg !== undefined || mi.vegetarian !== undefined));
    const isSeasonal = mi.seasonal ?? mi.isSeasonal ?? false;
    if (foodType === "vegetarian") return Boolean(isVegetarian);
    if (foodType === "nonveg") return Boolean(isNonVeg);
    if (foodType === "seasonal") return Boolean(isSeasonal);
    return true;
  };

  const filteredMenuItems = menuItems.filter((mi) => matchesCategory(mi) && matchesFoodType(mi));

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log("[CategoryDebug] Selected category=", selectedCategory);
      console.log("[CategoryDebug] First 5 menu items category snapshot:", menuItems.slice(0,5).map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        foodCategory: m.foodCategory,
        foodCategoryId: m.foodCategoryId,
        categoryId: m.categoryId
      })));
      console.log("[CategoryDebug] Filtered count=", filteredMenuItems.length, " / total=", menuItems.length);
      const nullWithCategories = menuItems.filter(m => !m.foodCategory && (m.foodCategoryId || m.categoryId));
      if (nullWithCategories.length > 0) {
        console.log('[CategoryDebug] Items missing nested foodCategory but have id field:', nullWithCategories.map(i => ({id:i.id, foodCategoryId:i.foodCategoryId, categoryId:i.categoryId})));
      }
    }
  }, [restaurant.categories, selectedCategory, menuItems, filteredMenuItems]);

  // No frontend filter needed; backend returns filtered items
  const { id } = useParams();
  const handleFilter = (e) => {
    setFoodType(e.target.value);
    console.log(e.target.value, e.target.name);
  };
  const handleFilterCategory = (e, value) => {
  setSelectedCategory(value);
  console.log("Selected category value:", value);
  };
  //console.log("restaurant details", restaurant);
  //console.log("restaurant ID from params:", id);
  //console.log("current restaurant data:", restaurantData);

  useEffect(() => {
    dispatch(getRestaurantByID({ jwt, restaurantId: id }));
    dispatch(getRestaurantsCategory({ jwt, restaurantId: id }));
  }, [dispatch, id, jwt]);

  // keep categoriesList in sync: prefer server-provided categories, fallback to menuItems' foodCategory
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
      return;
    }
    // derive unique categories from menuItems if server didn't provide any
    const derived = [];
    const seen = new Set();
    menuItems.forEach((mi) => {
      const cat = mi.foodCategory ?? mi.category ?? mi.food_category;
      if (!cat) return;
      const idVal = cat.id ?? cat._id ?? cat.categoryId ?? cat;
      const nameVal = cat.name ?? cat.title ?? String(cat);
      const key = String(idVal ?? nameVal);
      if (!seen.has(key)) {
        seen.add(key);
        derived.push({ id: idVal, name: nameVal });
      }
    });
    setCategoriesList(derived);
  }, [categories, menuItems]);

  useEffect(() => {
    // Resolve to id for backend (categoryId wins)
    let categoryId = "";
    if (selectedCategory && categoriesList && categoriesList.length > 0) {
      const match = categoriesList.find(c => String(c.id) === String(selectedCategory) || String(c.name) === String(selectedCategory));
      if (match && match.id !== undefined && match.id !== null) {
        categoryId = match.id;
      }
    }
    const payload = {
      jwt,
      restaurantId: id,
      vegetarian: foodType === "vegetarian",
      nonveg: foodType === "nonveg",
      seasonal: foodType === "seasonal",
      categoryId: categoryId || "",
      food_category: selectedCategory || "", // keep name for compatibility
    };
    console.log("Dispatching getMenuItemsByRestaurantId with:", payload);
    dispatch(getMenuItemsByRestaurantId(payload));
  }, [dispatch, id, jwt, selectedCategory, foodType, categoriesList]);

  // Loading state
  if (restaurant && restaurant.loading) {
    return (
      <div className="px-5 lg:px-20 py-10">
        <div className="text-center">
          <Typography variant="h6">Loading restaurant details...</Typography>
        </div>
      </div>
    );
  }

  // Error state
  if (restaurant && restaurant.error) {
    const errorMessage = getErrorMessage(restaurant.error);
    const isConstraintError = isConstraintViolation(restaurant.error);
    const errorStatus = restaurant.error.response?.status;

    return (
      <div className="px-5 lg:px-20 py-10">
        <div className="text-center space-y-4">
          <Typography variant="h6" color="error">
            {isConstraintError
              ? "Restaurant Data Conflict"
              : errorStatus === 404
              ? "Restaurant Not Found"
              : "Error Loading Restaurant"}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ maxWidth: 600, margin: "0 auto" }}
          >
            {errorMessage}
          </Typography>
          {errorStatus && (
            <Typography variant="caption" color="textSecondary">
              Error Code: {errorStatus}
            </Typography>
          )}
          {isConstraintError && (
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: "block", mt: 2 }}
            >
              If you believe this is an error, please contact support.
            </Typography>
          )}
        </div>
      </div>
    );
  }

  // No restaurant found
  // Show 'not found' only if restaurantData is empty and not loading
  if (
    Object.keys(restaurantData).length === 0 &&
    !(restaurant && restaurant.loading)
  ) {
    return (
      <div className="px-5 lg:px-20 py-10">
        <div className="text-center">
          <Typography variant="h6">Restaurant not found</Typography>
          <Typography variant="body2" color="textSecondary">
            The restaurant you're looking for doesn't exist or may have been
            removed.
          </Typography>
        </div>
      </div>
    );
  }

  const normalizedAddress = normalizeAddress(restaurantData.address);
  return (
    <div className="px-5 lg:px-20">
      <section>
        <h3 className="text-gray-500 py-2 mt-10">
          Home / {normalizedAddress.country || "India"} /{" "}
          {restaurantData.cuisineType || "Food"} / {restaurantData.id || id}
        </h3>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <img
                className="w-full h-[40vh] object-cover"
                src={
                  restaurantData.images && restaurantData.images.length > 0
                    ? restaurantData.images[0]
                    : "https://cdn.pixabay.com/photo/2021/07/20/06/04/restaurant-6479818_1280.jpg"
                }
                alt={restaurantData.name || "Restaurant"}
              />
            </Grid>
            {restaurant.restaurant?.images &&
              restaurant.restaurant.images.length > 1 && (
                <>
                  <Grid item xs={12} lg={6}>
                    <img
                      className="w-full h-[40vh] object-cover"
                      src={
                        restaurantData.images && restaurantData.images[1]
                          ? restaurantData.images[1]
                          : "https://cdn.pixabay.com/photo/2016/02/10/13/35/hotel-1191718_1280.jpg"
                      }
                      alt={restaurantData.name || "Restaurant"}
                    />
                  </Grid>
                  <Grid item xs={12} lg={6}>
                    <img
                      className="w-full h-[40vh] object-cover"
                      src={
                        restaurantData.images && restaurantData.images[2]
                          ? restaurantData.images[2]
                          : "https://res.cloudinary.com/dce7zfpke/image/upload/v1749215719/r2_gpexlu.jpg"
                      }
                      alt={restaurantData.name || "Restaurant"}
                    />
                  </Grid>
                </>
              )}
          </Grid>
        </div>
        <div className="pt-3 pb-5">
          <h1 className="text-4xl font-semibold">
            {restaurantData.name || "Restaurant Name"}
          </h1>
          <p className="text-gray-500 mt-1">
            {restaurantData.description ||
              "Experience the bold and vibrant flavors of India at our Indian Fast Food hub. Serving quick, authentic, and mouthwatering street-style dishes, our menu is a tribute to the spices and traditions of Indian cuisine. From crispy samosas and spicy chaats to piping hot dosas and tangy pav bhaji, every item is prepared fresh and served fast. Perfect for a quick bite or a flavorful feast, we bring the taste of Indian streets to your table — fast, fresh, and full of flavor."}
          </p>
          <div className="space-y-3 mt-3">
            <p className="text-gray-500 flex items-center gap-3">
              <LocationOnIcon />
              <span>
                {normalizedAddress && (normalizedAddress.street || normalizedAddress.streetAddress || normalizedAddress.city || normalizedAddress.state || normalizedAddress.stateProvince || normalizedAddress.postalCode)
                  ? [normalizedAddress.street || normalizedAddress.streetAddress, normalizedAddress.city, normalizedAddress.state || normalizedAddress.stateProvince, normalizedAddress.postalCode].filter(Boolean).join(', ')
                  : "123 Main Street, City, State, 12345"}
              </span>
            </p>
            <p className="text-gray-500 flex items-center gap-3">
              <CalendarTodayIcon />
              <span>
                {restaurantData.openingHours ||
                  "Mon-Sun: 10:00 AM - 11:00 PM(Today)"}
              </span>
            </p>
          </div>
        </div>
      </section>
      <Divider />
      <section className="pt-[2rem] lg:flex relative">
        <div className="space-y-10 lg:w-[20%] filter ">
          <div className="box space-y-5 lg:sticky top-28">
            <div>
              <Typography variant="h5" sx={{ paddingBottom: "1rem" }}>
                FoodType
              </Typography>
              <FormControl className="py-10 space-y-5">
                <RadioGroup
                  onChange={handleFilter}
                  name="food_type"
                  value={foodType}
                >
                  {foodTypes.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={<Radio />}
                      label={item.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </div>
            <Divider />
            <div>
              <Typography variant="h5" sx={{ paddingBottom: "1rem" }}>
                Food Category
              </Typography>
              <FormControl className="py-10 space-y-5">
                <RadioGroup
                  onChange={handleFilterCategory}
                  name="food_category"
                  value={selectedCategory}
                >
                  {/* 'All' option to clear category filter */}
                  <FormControlLabel
                    key="all-categories"
                    value=""
                    control={<Radio />}
                    label="All"
                  />
                  {categoriesList && categoriesList.length > 0 ? (
                    categoriesList.map((item) => {
                      const key = item.id ?? item.name;
                      const val = item.id ?? item.name; // prefer id, fallback to name
                      return (
                        <FormControlLabel
                          key={key}
                          value={val}
                          control={<Radio />}
                          label={item.name}
                        />
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500">No categories available</div>
                  )}
                </RadioGroup>
              </FormControl>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:w-[80%] lg:pl-10">
          {filteredMenuItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default RestaurantDetails;
