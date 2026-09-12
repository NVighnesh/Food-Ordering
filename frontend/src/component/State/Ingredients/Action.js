import {
  CREATE_INGREDIENT_CATEGORY_SUCCESS,
  CREATE_INGREDIENT_SUCCESS,
  CREATE_INGREDIENT_FAILURE,
  CREATE_INGREDIENT_REQUEST,
  GET_INGREDIENTS,
  GET_INGREDIENT_CATEGORY_FAILURE,
  GET_INGREDIENT_CATEGORY_SUCCESS,
  GET_INGREDIENT_CATEGORY_REQUEST,
  UPDATE_STOCK,
} from "./ActionTypes";
import { api } from "../../config/api";



export const getIngredientsOfRestaurant = ({ id, jwt }) => {
  return async (dispatch) => {
    if (!id) return;
    try {
      const response = await api.get(`/api/admin/ingredients/restaurant/${id}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      console.log("get all ingredients", response.data);
      dispatch({ type: GET_INGREDIENTS, payload: response.data });
    } catch (error) {
      console.log("getIngredientsOfRestaurant error", error?.response?.data || error.message);
    }
  };
};

export const createIngredient = ({ data, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_INGREDIENT_REQUEST });
    try {
  console.log("[createIngredient] request payload", data);
      const response = await api.post(`/api/admin/ingredients`, data, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("create ingredients", response.data);
      dispatch({ type: CREATE_INGREDIENT_SUCCESS, payload: response.data });
    } catch (error) {
      const errPayload = error?.response?.data || error.message;
  console.log("[createIngredient] server error payload", errPayload);
      dispatch({ type: CREATE_INGREDIENT_FAILURE, payload: errPayload });
      throw error;
    }
  };
};

export const createIngredientCategory = ({ data, jwt }) => {
  console.log("data", data, "jwt", jwt);
  return async (dispatch) => {
    try {
      const response = await api.post(
        `/api/admin/ingredients/category`,
        data,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("create ingredients category", response.data);
      dispatch({
        type: CREATE_INGREDIENT_CATEGORY_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      console.log("error", error);
    }
  };
};

export const getIngredientCategory = ({ id, jwt }) => {
  return async (dispatch) => {
    if (!id) return;
    dispatch({ type: GET_INGREDIENT_CATEGORY_REQUEST });
    try {
      const response = await api.get(`/api/admin/ingredients/restaurant/${id}/category`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      console.log("get ingredients category", response.data);
      dispatch({ type: GET_INGREDIENT_CATEGORY_SUCCESS, payload: response.data });
    } catch (error) {
      const errPayload = error?.response?.data || error.message;
      console.log("getIngredientCategory error", errPayload);
      dispatch({ type: GET_INGREDIENT_CATEGORY_FAILURE, payload: errPayload });
    }
  };
};
export const updateStockOfIngredient = ({ id, jwt }) => {
  return async (dispatch) => {
    try {
      const { data } = await api.put(
        `/api/admin/ingredients/${id}/stock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("update stock of ingredient", data);
      dispatch({
        type: UPDATE_STOCK,
        payload: data,
      });
    } catch (error) {
      console.log("error", error);
    }
  };
};
