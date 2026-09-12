import { applyMiddleware, combineReducers, legacy_createStore } from "redux";
import { authReducer } from "./Authentication/Reducer";
import { thunk } from "redux-thunk";

import menuItemReducer from "./Menu/Reducer";
import cartReducer from "./Cart/Reducer";
import { orderReducer } from "./Order/Reducer";
import restaurantOrderReducer from "./Restaurant Order/Reducer";
import { ingredientsReducer } from "./Ingredients/Reducer";
import restaurantReducer from "./Restaurant/Reducer";
import { addressReducer } from "./Address/Reducer";
import { notificationReducer } from "./Notification/Reducer";

const rooteReducer =combineReducers ({
    auth:authReducer,
    restaurant:restaurantReducer,
    menu:menuItemReducer,
    cart:cartReducer,
    order:orderReducer,
    restaurantOrder:restaurantOrderReducer,
    ingredients:ingredientsReducer,
    addresses:addressReducer,
    notification:notificationReducer,
    

})

export const store=legacy_createStore(rooteReducer,applyMiddleware(thunk));
