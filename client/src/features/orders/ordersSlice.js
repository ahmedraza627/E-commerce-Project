import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderApi, extractError } from '../../api/endpoints.js';

const initialState = {
  items: [], // my order history
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  current: null,
  adminItems: [],
  adminPagination: { page: 1, limit: 20, total: 0, pages: 1 },
  status: 'idle',
  checkoutStatus: 'idle',
  error: null,
};

export const placeOrder = createAsyncThunk('orders/place', async (payload, { rejectWithValue }) => {
  try {
    return await orderApi.create(payload);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMine', async (params, { rejectWithValue }) => {
  try {
    return await orderApi.myOrders(params);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    return await orderApi.get(id);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchAllOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await orderApi.all(params);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    return await orderApi.updateStatus(id, status);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.checkoutStatus = 'loading';
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.checkoutStatus = 'succeeded';
        state.current = action.payload.order;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.checkoutStatus = 'failed';
        state.error = action.payload?.message;
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.pagination = { ...state.pagination, ...action.payload.pagination };
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message;
      })
      .addCase(fetchOrder.pending, (state) => {
        state.status = 'loading';
        state.current = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload.order;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.adminItems = action.payload.items;
        state.adminPagination = { ...state.adminPagination, ...action.payload.pagination };
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload.order;
        const idx = state.adminItems.findIndex((o) => o._id === updated._id);
        if (idx !== -1) state.adminItems[idx] = updated;
      });
  },
});

export default ordersSlice.reducer;
