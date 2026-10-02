import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import store from './app/store.js';
import { fetchCurrentUser, sessionExpired, sessionRefreshed } from './features/auth/authSlice.js';
import { toggleSearch } from './features/ui/uiSlice.js';
import ThemeWatcher from './components/ui/ThemeWatcher.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import CartDrawer from './components/cart/CartDrawer.jsx';
import ToastStack from './components/ui/ToastStack.jsx';
import SearchOverlay from './components/search/SearchOverlay.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Browser events → Redux (silent refresh / forced logout from the API layer)
function AuthEventBridge() {
  const dispatch = useDispatch();
  useEffect(() => {
    const onRefreshed = (e) => dispatch(sessionRefreshed(e.detail));
    const onExpired = () => dispatch(sessionExpired());
    window.addEventListener('auth:refreshed', onRefreshed);
    window.addEventListener('auth:logout', onExpired);
    return () => {
      window.removeEventListener('auth:refreshed', onRefreshed);
      window.removeEventListener('auth:logout', onExpired);
    };
  }, [dispatch]);
  return null;
}

// Probes the session once on boot; gates the whole UI on `initialized`
function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { initialized, status } = useSelector((s) => s.auth);
  useEffect(() => {
    if (!initialized && status === 'idle') dispatch(fetchCurrentUser());
  }, [initialized, status, dispatch]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-50 dark:border-t-transparent" />
      </div>
    );
  }

  return children;
}

// Global Cmd/Ctrl+K → search overlay
function KeyboardShortcuts() {
  const dispatch = useDispatch();
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(toggleSearch());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthEventBridge />
        <ThemeWatcher />
        <KeyboardShortcuts />
        <AuthInitializer>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <AppRoutes />
            </main>
            <Footer />
          </div>
          <CartDrawer />
          <SearchOverlay />
          <ToastStack />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  );
}
