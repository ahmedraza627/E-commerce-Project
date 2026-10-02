import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer, {
  fetchCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  sessionExpired,
} from '../features/auth/authSlice.js';
import cartReducer, { fetchCart, resetCart, cancelAllCartOps } from '../features/cart/cartSlice.js';
import productsReducer from '../features/products/productsSlice.js';
import ordersReducer from '../features/orders/ordersSlice.js';
import uiReducer, { selectTheme } from '../features/ui/uiSlice.js';

/** Auth transitions sync the server cart in/out of the store. */
const authCartSync = createListenerMiddleware();

authCartSync.startListening({
  actionCreator: fetchCurrentUser.fulfilled,
  effect: (_action, api) => api.dispatch(fetchCart()),
});
authCartSync.startListening({
  actionCreator: loginUser.fulfilled,
  effect: (_action, api) => api.dispatch(fetchCart()),
});
authCartSync.startListening({
  actionCreator: registerUser.fulfilled,
  effect: (_action, api) => api.dispatch(fetchCart()),
});
authCartSync.startListening({
  actionCreator: sessionExpired,
  effect: (_action, api) => {
    cancelAllCartOps(); // abort in-flight cart requests + clear debounce timers
    api.dispatch(resetCart());
  },
});
authCartSync.startListening({
  actionCreator: logoutUser.fulfilled,
  effect: (_action, api) => {
    cancelAllCartOps(); // abort in-flight cart requests + clear debounce timers
    api.dispatch(resetCart());
  },
});

/** Persist theme preference to localStorage on every change. */
const themePersist = createListenerMiddleware();
themePersist.startListening({
  predicate: (_action, currentState, previousState) =>
    currentState.ui.theme !== previousState.ui.theme,
  effect: (_action, api) => {
    window.localStorage.setItem('shopswift-theme', selectTheme(api.getState()));
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    orders: ordersReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault().prepend(authCartSync.middleware, themePersist.middleware),
});

export default store;
