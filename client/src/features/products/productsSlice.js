import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productApi, extractError } from '../../api/endpoints.js';

const initialState = {
  items: [],
  pagination: { page: 1, limit: 12, total: 0, pages: 1 },
  filters: {
    search: '',
    category: '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
    inStock: false,
  },
  categories: [],
  current: null, // product detail
  status: 'idle',
  detailStatus: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const { filters, pagination } = getState().products;
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sort: filters.sort,
    };
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.inStock) params.inStock = 'true';
    return await productApi.list(params);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (idOrSlug, { rejectWithValue }) => {
  try {
    return await productApi.get(idOrSlug);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchCategories = createAsyncThunk('products/categories', async (_, { rejectWithValue }) => {
  try {
    return await productApi.categories();
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      // Reset to page 1 whenever filters change — standard catalog UX
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.current = null;
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.pagination = { ...state.pagination, ...action.payload.pagination };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.detailStatus = 'loading';
        state.current = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.current = action.payload.product;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload?.message;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories ?? [];
      });
  },
});

export const { setFilter, setPage, clearCurrentProduct } = productsSlice.actions;

export const selectFilters = (state) => state.products.filters;
export const selectPagination = (state) => state.products.pagination;

export default productsSlice.reducer;
