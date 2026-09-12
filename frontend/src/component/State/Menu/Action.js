

import { api } from "../../config/api";
import {
  CREATE_MENU_ITEM_FAILURE,
  CREATE_MENU_ITEM_SUCCESS,
  DELETE_MENU_ITEM_FAILURE,
  DELETE_MENU_ITEM_REQUEST,
  DELETE_MENU_ITEM_SUCCESS,
  GET_MENU_ITEMS_BY_RESTAURANT_ID_FAILURE,
  GET_MENU_ITEMS_BY_RESTAURANT_ID_REQUEST,
  GET_MENU_ITEMS_BY_RESTAURANT_ID_SUCCESS,
  SEARCH_MENU_ITEM_FAILURE,
  SEARCH_MENU_ITEM_REQUEST,
  SEARCH_MENU_ITEM_SUCCESS,
  UPDATE_MENU_ITEM_AVAILBILITY_FAILURE,
  UPDATE_MENU_ITEM_AVAILBILITY_REQUEST,
  UPDATE_MENU_ITEM_AVAILBILITY_SUCCESS,
  UPDATE_MENU_ITEM_CATEGORY_REQUEST,
  UPDATE_MENU_ITEM_CATEGORY_SUCCESS,
  UPDATE_MENU_ITEM_CATEGORY_FAILURE,
} from "./ActionTypes";

export const createMenuItem = ({ menu, jwt }) => {
  return async (dispatch) => {
    try {
      // Start with shallow copy
      const payload = { ...menu };

      // Normalize category -> backend might expect nested object under foodCategory
      const catIdCandidate = payload.foodCategoryId || payload.categoryId || payload.category || (payload.foodCategory && payload.foodCategory.id);
      if (!payload.foodCategory && catIdCandidate) {
        if (typeof catIdCandidate === "object" && catIdCandidate.id) {
          payload.foodCategory = { id: catIdCandidate.id };
        } else if (typeof catIdCandidate === "string" || typeof catIdCandidate === "number") {
          payload.foodCategory = { id: catIdCandidate };
        }
      }
      if (payload.foodCategory && (typeof payload.foodCategory === "string" || typeof payload.foodCategory === "number")) {
        payload.foodCategory = { id: payload.foodCategory };
      }
      // If after normalization we still don't have a nested object but we do have a category id, build it.
      if (!payload.foodCategory) {
        if (catIdCandidate !== undefined && catIdCandidate !== null && catIdCandidate !== "") {
          payload.foodCategory = { id: catIdCandidate };
        } else {
          console.warn("[createMenuItem] No category id provided; menu item will have null foodCategory");
        }
      }
      // BACKEND COMPAT: also send 'category' alias if backend expects CreateFoodRequest.category
      if (!payload.category && payload.foodCategory) {
        payload.category = { ...payload.foodCategory };
      }
      // Some backends used a typo 'seasional' - duplicate flag for safety
      if (payload.seasonal !== undefined && payload.seasional === undefined) {
        payload.seasional = payload.seasonal; // ensure both present
      }

      // Ensure restaurantId present
      if (!payload.restaurantId && payload.restaurant?.id) {
        payload.restaurantId = payload.restaurant.id;
      }

      // Ingredients: backend may expect array of objects named "ingredients". Preserve ingredientIds too.
      if (Array.isArray(payload.ingredientIds) && (!payload.ingredients || payload.ingredients.length === 0)) {
        payload.ingredients = payload.ingredientIds.map((id) => ({ id }));
      }

      console.log("[createMenuItem] normalized payload", payload);
      const { data } = await api.post("api/admin/food", payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      // Some backends may omit ingredients relation in create response; merge fallback from payload
      let enriched = { ...data };
      if ((!
        enriched.ingredients || enriched.ingredients.length === 0) && Array.isArray(payload.ingredientIds)
      ) {
        enriched.ingredients = payload.ingredientIds.map((id) => ({ id }));
      }
      // Also ensure foodCategory fallback if missing but we sent one
      if (!enriched.foodCategory && payload.foodCategory) {
        enriched.foodCategory = payload.foodCategory;
      }
      console.log("Menu item created successfully (enriched):", enriched);
      dispatch({ type: CREATE_MENU_ITEM_SUCCESS, payload: enriched });

      // Refetch full menu list so any server-side populated relations (ingredients, category) load
      const restIdForFetch = payload.restaurantId || data?.restaurant?.id;
      if (restIdForFetch) {
        dispatch(
          getMenuItemsByRestaurantId({
            jwt,
            restaurantId: restIdForFetch,
            vegetarian: false,
            nonveg: false,
            seasonal: false,
            food_category: "",
          })
        );
      }
    } catch (error) {
      console.log("Error creating menu item:", error?.response?.data || error.message);
      dispatch({ type: CREATE_MENU_ITEM_FAILURE, payload: error });
    }
  };
};

// Update a food item's category via admin repair endpoint
export const updateFoodCategory = ({ foodId, categoryId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_MENU_ITEM_CATEGORY_REQUEST, payload: { foodId, categoryId } });
    try {
      const { data } = await api.patch(
        `/api/admin/food/${foodId}/category?categoryId=${encodeURIComponent(categoryId)}`,
        {},
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      console.log("Food category updated successfully:", data);
      dispatch({ type: UPDATE_MENU_ITEM_CATEGORY_SUCCESS, payload: data });
    } catch (error) {
      console.log("Error updating food category:", error?.response?.data || error.message);
      dispatch({ type: UPDATE_MENU_ITEM_CATEGORY_FAILURE, payload: { foodId, error } });
    }
  };
};
export const getMenuItemsByRestaurantId = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: GET_MENU_ITEMS_BY_RESTAURANT_ID_REQUEST });
    try {
        const catName = encodeURIComponent(reqData.food_category || "");
        const catId = reqData.categoryId !== undefined && reqData.categoryId !== null && reqData.categoryId !== ""
          ? encodeURIComponent(reqData.categoryId)
          : "";
        // Prefer categoryId; keep name params for backwards compatibility
        const url = `/api/food/restaurant/${reqData.restaurantId}?vegetarian=${reqData.vegetarian}&nonveg=${reqData.nonveg}&seasonal=${reqData.seasonal}`
          + `${catId ? `&categoryId=${catId}` : ""}`
          + `${catName ? `&food_category=${catName}&food_Category=${catName}` : ""}`;
        console.log("Fetching menu items with URL:", url);
        console.log("Request headers: Authorization: Bearer", reqData.jwt);
        const { data } = await api.get(url, {
          headers: { Authorization: `Bearer ${reqData.jwt}` },
        });
        console.log("Menu items fetched successfully:", data);
        // If backend returned an empty array unexpectedly, try a fallback GET without query params
        let finalData = data;
        if (Array.isArray(data) && data.length === 0) {
          try {
            console.warn("Menu items empty for filtered request; trying fallback fetch without query params");
            const fallbackUrl = `/api/food/restaurant/${reqData.restaurantId}`;
            const { data: fallbackData } = await api.get(fallbackUrl, {
              headers: { Authorization: `Bearer ${reqData.jwt}` },
            });
            console.log("Fallback menu items fetched:", fallbackData);
            // Use fallback if it returns something
            if (Array.isArray(fallbackData) && fallbackData.length > 0) {
              finalData = fallbackData;
            }
          } catch (fbErr) {
            console.error("Fallback fetch failed:", fbErr);
          }
        }
      dispatch({
        type: GET_MENU_ITEMS_BY_RESTAURANT_ID_SUCCESS,
        payload: finalData,
      });
    } catch (error) {
      console.log("Error fetching menu items:", error);
      dispatch({
        type: GET_MENU_ITEMS_BY_RESTAURANT_ID_FAILURE,
        payload: error,
      });
    }
  };
};
export const searchMenuItem=({keyword,jwt})=>{
  return async (dispatch) => {
    dispatch({ type: SEARCH_MENU_ITEM_REQUEST });
    try {
      const { data } = await api.get(`/api/food/search?name=${keyword}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Menu items searched successfully:", data);
      dispatch({
        type: SEARCH_MENU_ITEM_SUCCESS,
        payload: data,
      });
    } catch (error) {
      console.log("Error searching menu items:", error);
      dispatch({
        type: SEARCH_MENU_ITEM_FAILURE,
        payload: error,
      });
    }
  };
}

// export const getAllIngredientsOfMenuItem = (reqData) => {
//   return async (dispatch) => {
//     dispatch({ type: GET_MENU_ITEMS_BY_RESTAURANT_ID_REQUEST });
//     try {
//       const { data } = await api.get(
//         `/api/food/ingredients/${reqData.menuItemId}`,
//         {
//           headers: { Authorization: `Bearer ${reqData.jwt}` },
//         }
//       );
//       console.log("Ingredients fetched successfully:", data);
//       dispatch({
//         type: GET_MENU_ITEMS_BY_RESTAURANT_ID_SUCCESS,
//         payload: data,
//       });
//     } catch (error) {
//       console.log("Error fetching ingredients:", error);
//       dispatch({
//         type: GET_MENU_ITEMS_BY_RESTAURANT_ID_FAILURE,
//         payload: error,
//       });
//     }
//   };
// }

export const updateMenuItemsAvailbility = ({ foodId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_MENU_ITEM_AVAILBILITY_REQUEST });
    try {
      const { data } = await api.put(
        `/api/admin/food/${foodId}`,
        {},
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      console.log("Menu item availability updated successfully:", data);
      dispatch({ type: UPDATE_MENU_ITEM_AVAILBILITY_SUCCESS, payload: data });
    } catch (error) {
      console.log("Error updating menu item availability:", error?.response?.data || error.message);
      dispatch({ type: UPDATE_MENU_ITEM_AVAILBILITY_FAILURE, payload: error });
    }
  };
};

export const deleteFoodAction = ({ foodId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: DELETE_MENU_ITEM_REQUEST });
    try {
      const { data } = await api.delete(`/api/admin/food/${foodId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
  console.log("Menu item deleted successfully:", data);
  // Dispatch the id so reducer filter works
  dispatch({ type: DELETE_MENU_ITEM_SUCCESS, payload: foodId });
  // Optional: silent refetch to ensure server authoritative state (skip if not needed)
  // const restaurantId = data?.restaurant?.id; // backend likely not returning entity
  // if (restaurantId) {
  //   dispatch(getMenuItemsByRestaurantId({
  //     jwt,
  //     restaurantId,
  //     vegetarian: false,
  //     nonveg: false,
  //     seasonal: false,
  //     food_category: "",
  //   }));
  // }
    } catch (error) {
      console.log("Error deleting menu item:", error?.response?.data || error.message);
      dispatch({ type: DELETE_MENU_ITEM_FAILURE, payload: error });
    }
  };
};