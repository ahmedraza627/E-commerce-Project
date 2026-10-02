import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/endpoints.js';

const initialState = {
  user: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  initialized: false, // becomes true after the first /auth/me probe
};

// Restore the session from the HTTP-only cookie on app boot.
// If the access cookie expired, the interceptor silently refreshes first.
export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const { user } = await authApi.me();
  return user;
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authApi.login(credentials);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.register(payload);
  } catch (err) {
    return rejectWithValue(
      err.response?.data?.details?.[0]?.message ?? err.response?.data?.message ?? 'Registration failed'
    );
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

export const logoutAllDevices = createAsyncThunk('auth/logoutAll', async () => {
  await authApi.logoutAll();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Driven by apiClient events: silent refresh succeeded / session died
    sessionRefreshed: (state, action) => {
      state.user = action.payload?.user ?? state.user;
    },
    sessionExpired: (state) => {
      state.user = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = 'failed';
        state.user = null;
        state.initialized = true;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      })
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      });
  },
});

export const { clearError, sessionRefreshed, sessionExpired } = authSlice.actions;

export default authSlice.reducer;
