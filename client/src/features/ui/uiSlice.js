import { createSlice, nanoid } from '@reduxjs/toolkit';

/** Boot theme: saved preference → OS preference → light. */
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('shopswift-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState = {
  cartDrawerOpen: false,
  searchOpen: false,
  theme: getInitialTheme(), // 'light' | 'dark'
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCartDrawer: (state) => {
      state.cartDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.cartDrawerOpen = false;
    },
    toggleCartDrawer: (state, action) => {
      state.cartDrawerOpen = action.payload ?? !state.cartDrawerOpen;
    },
    toggleSearch: (state, action) => {
      state.searchOpen = action.payload ?? !state.searchOpen;
    },
    openSearch: (state) => {
      state.searchOpen = true;
    },
    closeSearch: (state) => {
      state.searchOpen = false;
    },
    setTheme: (state, action) => {
      state.theme = action.payload; // 'light' | 'dark'
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    pushToast: {
      reducer: (state, action) => {
        state.toasts.push(action.payload);
        if (state.toasts.length > 3) state.toasts.shift(); // keep the last 3
      },
      prepare: (message, tone = 'success') => ({ payload: { id: nanoid(), message, tone } }),
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  toggleSearch,
  openSearch,
  closeSearch,
  setTheme,
  toggleTheme,
  pushToast,
  dismissToast,
} = uiSlice.actions;

export const selectCartDrawerOpen = (state) => state.ui.cartDrawerOpen;
export const selectSearchOpen = (state) => state.ui.searchOpen;
export const selectTheme = (state) => state.ui.theme;

export default uiSlice.reducer;
