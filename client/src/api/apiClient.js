import axios from 'axios';

/**
 * Axios instance bound to the same origin via the Vite dev proxy.
 * withCredentials matters in production when the API lives on another domain:
 * it makes the browser attach + store our HTTP-only auth cookies.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Silent refresh: single-flight lock + wait queue ----
//
// `refreshPromise` is the lock: the first 401 creates it, every concurrent 401
// awaits the SAME promise instead of firing its own /auth/refresh. When the
// refresh settles the lock is released so a later 401 can start a new cycle.

/**
 * Auth flows where a 401 is a legitimate answer (bad credentials, expired
 * session) and must NOT trigger a refresh attempt. `logout` is excluded
 * because replaying it after a refresh would be pointless — the refresh
 * cookie is already consumed/revoked by the time it 401s.
 */
const REFRESH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshPromise = null;
let logoutBroadcast = false;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/v1/auth/refresh', null, { withCredentials: true })
      .then((res) => {
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: res.data.data }));
        return res.data.data;
      })
      .finally(() => {
        refreshPromise = null; // release the lock
      });
  }
  return refreshPromise;
};

/** Broadcast session-death exactly once per outage, not once per 401. */
const broadcastLogout = () => {
  if (logoutBroadcast) return;
  logoutBroadcast = true;
  window.dispatchEvent(new CustomEvent('auth:logout'));
  // Re-arm after the current storm of 401s has drained.
  setTimeout(() => {
    logoutBroadcast = false;
  }, 1000);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // Aborted requests (cart op superseded, search debounce) are never retried
    if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED' || config?.signal?.aborted) {
      return Promise.reject(error);
    }

    // Only genuine 401s on data endpoints participate in the refresh dance
    if (response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }

    const url = config.url ?? '';
    if (REFRESH_EXCLUDED_PATHS.some((p) => url.startsWith(p))) {
      return Promise.reject(error);
    }

    config._retried = true; // never replay more than once
    try {
      await refreshSession(); // queued callers share this one promise
      return api(config); // replay the original request with fresh cookies
    } catch (refreshError) {
      broadcastLogout();
      return Promise.reject(refreshError);
    }
  }
);

/** Normalizes axios errors into `{ message, details?, status? }` for the UI. */
export const extractError = (error) => ({
  message:
    error.response?.data?.message ??
    (error.request ? 'Network error — is the server running?' : error.message),
  details: error.response?.data?.details,
  status: error.response?.status,
  canceled: axios.isCancel?.(error) || error.code === 'ERR_CANCELED',
});
