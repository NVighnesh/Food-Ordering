import * as actionTpes from "./ActionTypes";

const initialState = {
  menuItems: [],
  loading: false,
  error: null,
  search: [],
  message: null,
};
const menuItemReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTpes.CREATE_MENU_ITEM_REQUEST:
    case actionTpes.GET_MENU_ITEMS_BY_RESTAURANT_ID_REQUEST:
    case actionTpes.DELETE_MENU_ITEM_REQUEST:
    case actionTpes.SEARCH_MENU_ITEM_REQUEST:
    case actionTpes.UPDATE_MENU_ITEM_AVAILBILITY_REQUEST:
    case actionTpes.UPDATE_MENU_ITEM_CATEGORY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null,
      };
    case actionTpes.CREATE_MENU_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        menuItems: [...state.menuItems, action.payload],
        message: "Menu item created successfully",
      };
    case actionTpes.GET_MENU_ITEMS_BY_RESTAURANT_ID_SUCCESS:
      return {
        ...state,
        loading: false,
        menuItems: action.payload,
        message: "Menu items fetched successfully",
      };
    case actionTpes.DELETE_MENU_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        menuItems: state.menuItems.filter(
          (menuItem) => menuItem.id !== action.payload
        ),
        message: "Menu item deleted successfully",
      };
    case actionTpes.UPDATE_MENU_ITEM_AVAILBILITY_SUCCESS:
      console.log("Update menu item availability request", action.payload.id);
      return {
        ...state,
        loading: true,
        menuItems: state.menuItems.map((menuItem) =>
          menuItem.id === action.payload.id ? action.payload : menuItem
        ),
      };
    case actionTpes.UPDATE_MENU_ITEM_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        menuItems: state.menuItems.map((menuItem) =>
          menuItem.id === action.payload.id ? action.payload : menuItem
        ),
        message: "Menu item category updated successfully",
      };
    case actionTpes.SEARCH_MENU_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        search: action.payload,
        message: "Menu items searched successfully",
      };
    case actionTpes.CREATE_MENU_ITEM_FAILURE:
    case actionTpes.GET_MENU_ITEMS_BY_RESTAURANT_ID_FAILURE:
    case actionTpes.DELETE_MENU_ITEM_FAILURE:
    case actionTpes.SEARCH_MENU_ITEM_FAILURE:
    case actionTpes.UPDATE_MENU_ITEM_AVAILBILITY_FAILURE:
    case actionTpes.UPDATE_MENU_ITEM_CATEGORY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null,
      };

    default:
      return state;
  }
};

export default menuItemReducer;
