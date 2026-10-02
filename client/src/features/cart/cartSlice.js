import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi, extractError } from '../../api/endpoints.js';

const initialState = {
  items: [],
  subtotal: 0,
  itemCount: 0,
  status: 'idle',
  error: null,
};

const clone = (items) => JSON.parse(JSON.stringify(items));

/** Optimistic totals, recomputed client-side between server syncs. */
const recompute = (state) => {
  state.itemCount = state.items.reduce((n, i) => n + i.qty, 0);
  state.subtotal = Number(state.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2));
};

/** Server cart shape → slice state (server truth always wins). */
const hydrate = (state, cart) => {
  if (!cart) return; // superseded responses never clobber state
  state.items = cart.items ?? [];
  state.itemCount = cart.itemCount ?? state.items.reduce((n, i) => n + i.qty, 0);
  state.subtotal =
    cart.subtotal ?? Number(state.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2));
  state.status = 'succeeded';
  state.error = null;
};

// ---------------------------------------------------------------------------
// In-flight operation ledger — the heart of the race-condition fix.
//
// Every cart mutation (per product line) goes through this registry:
//  1. Acquire: any request still in flight for the SAME line is aborted via
//     its AbortController and marked superseded, so its response can never
//     overwrite newer state.
//  2. Update: the request fires with its own AbortController; a debounce
//     timer (for quantity changes) coalesces rapid +/- clicks into ONE
//     network call with the final qty.
//  3. Resolve/Abort: the ledger entry is cleaned up unless a NEWER op for
//     the same line has already replaced it.
// ---------------------------------------------------------------------------

const QTY_DEBOUNCE_MS = 400;

const opLedger = new Map(); // productId → { seq, controller, timer, superseded }

const abortLineOp = (productId, reason = 'superseded') => {
  const op = opLedger.get(productId);
  if (op?.controller && !op.controller.signal.aborted) op.controller.abort(reason);
};

const clearLineTimers = (productId) => {
  const op = opLedger.get(productId);
  if (op?.timer) clearTimeout(op.timer);
};

const ledgerSnapshot = () => {
  const snapshot = {};
  for (const [id, op] of opLedger) {
    snapshot[id] = { seq: op.seq, inFlight: Boolean(op.controller), debouncing: Boolean(op.timer) };
  }
  return snapshot;
};

/** Global abort for all lines — used on logout / cart reset. */
export const cancelAllCartOps = () => {
  for (const productId of opLedger.keys()) {
    abortLineOp(productId, 'reset');
    clearLineTimers(productId);
  }
  opLedger.clear();
};

/** True while any line has an in-flight request or pending debounce window. */
export const hasPendingCartOps = () => opLedger.size > 0;

/**
 * Resolves once the request settles (or aborts). Never throws for aborts —
 * the thunk simply resolves with `null` and the reducer ignores it.
 */
const runLineRequest = async (productId, requestFactory, { delayMs = 0 } = {}) => {
  abortLineOp(productId);
  clearLineTimers(productId);

  const prev = opLedger.get(productId) ?? {};
  const seq = (prev.seq ?? 0) + 1;
  const controller = new AbortController();

  const entry = { ...prev, seq, controller, timer: null, superseded: false };
  opLedger.set(productId, entry);

  try {
    // Debounce window: an abort here means a NEWER op superseded this one —
    // we resolve (not reject) so the old thunk never rolls back newer state.
    if (delayMs > 0) {
      await new Promise((resolve, reject) => {
        entry.timer = setTimeout(resolve, delayMs);
        controller.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    }

    const data = await requestFactory(controller.signal);
    // A newer op took over this line while we were waiting → discard.
    if (opLedger.get(productId)?.seq !== seq) return null;
    opLedger.delete(productId);
    return data;
  } catch (err) {
    if (controller.signal.aborted || opLedger.get(productId)?.seq !== seq) return null;
    opLedger.delete(productId);
    throw err; // genuine network/server failure → caller rejects the thunk
  }
};

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    return await cartApi.get();
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

/**
 * Add-to-cart. Rapid repeated clicks on the same product coalesce: the
 * optimistic reducer accumulates qty instantly, the network call debounces
 * 350ms and sends ONE addItem with the latest qty.
 */
export const quickAddToCart = createAsyncThunk(
  'cart/quickAdd',
  async ({ productId, qty = 1, product }, { dispatch, getState, rejectWithValue }) => {
    const prevItems = clone(getState().cart.items);
    dispatch(optimisticAdd({ productId, qty, product }));

    // Coalesce rapid clicks into one request with the accumulated qty.
    const targetQty = () => getState().cart.items.find((i) => i.product === productId)?.qty ?? qty;

    try {
      const data = await runLineRequest(
        productId,
        (signal) => cartApi.addItem(productId, targetQty(), signal),
        { delayMs: 350 }
      );
      if (data === null) return { superseded: true };
      return data.cart ?? data;
    } catch (err) {
      return rejectWithValue({ error: extractError(err), prevItems, productId });
    }
  }
);

/**
 * Set a line's quantity. The click updates the number instantly (optimistic),
 * then the actual PATCH is debounced 400ms — rapid +/- tapping sends a single
 * request carrying the final quantity, and any superseded in-flight PATCH is
 * aborted so a stale qty can never win.
 */
export const quickUpdateQty = createAsyncThunk(
  'cart/quickUpdate',
  async ({ productId, qty }, { dispatch, getState, rejectWithValue }) => {
    const prevItems = clone(getState().cart.items);
    dispatch(optimisticUpdate({ productId, qty }));

    try {
      const data = await runLineRequest(
        productId,
        (signal) => cartApi.updateItem(productId, qty, signal),
        { delayMs: QTY_DEBOUNCE_MS }
      );
      if (data === null) return { superseded: true };
      return data.cart ?? data;
    } catch (err) {
      return rejectWithValue({ error: extractError(err), prevItems, productId });
    }
  }
);

/** Remove a line. Supersedes any pending update/add for the same product. */
export const quickRemoveItem = createAsyncThunk(
  'cart/quickRemove',
  async (productId, { dispatch, getState, rejectWithValue }) => {
    const prevItems = clone(getState().cart.items);
    dispatch(optimisticRemove(productId));

    try {
      const data = await runLineRequest(productId, (signal) => cartApi.removeItem(productId, signal));
      if (data === null) return { superseded: true };
      return data.cart ?? data;
    } catch (err) {
      return rejectWithValue({ error: extractError(err), prevItems, productId });
    }
  }
);

/** Clear the whole cart. Aborts every per-line op. */
export const quickClearCart = createAsyncThunk('cart/quickClear', async (_, { dispatch, getState, rejectWithValue }) => {
  const prevItems = clone(getState().cart.items);
  for (const productId of opLedger.keys()) {
    abortLineOp(productId, 'superseded');
    clearLineTimers(productId);
  }
  opLedger.clear();
  dispatch(optimisticClear());

  try {
    const data = await cartApi.clear();
    return data.cart ?? data;
  } catch (err) {
    return rejectWithValue({ error: extractError(err), prevItems });
  }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /** Local mutation #1: add units (creates a placeholder line if new). */
    optimisticAdd: (state, action) => {
      const { productId, qty, product } = action.payload;
      const existing = state.items.find((i) => i.product === productId);
      if (existing) {
        existing.qty += qty;
      } else {
        state.items.push({
          product: productId,
          name: product?.name ?? 'Loading…',
          slug: product?.slug ?? '',
          image: product?.images?.[0] ?? null,
          price: product?.price ?? 0,
          qty,
        });
      }
      recompute(state);
    },
    /** Local mutation #2: set quantity (0 removes the line). */
    optimisticUpdate: (state, action) => {
      const { productId, qty } = action.payload;
      const item = state.items.find((i) => i.product === productId);
      if (item) {
        if (qty <= 0) state.items = state.items.filter((i) => i.product !== productId);
        else item.qty = qty;
      }
      recompute(state);
    },
    /** Local mutation #3: remove a line. */
    optimisticRemove: (state, action) => {
      state.items = state.items.filter((i) => i.product !== action.payload);
      recompute(state);
    },
    /** Local mutation #4: empty the cart. */
    optimisticClear: (state) => {
      state.items = [];
      recompute(state);
    },
    clearError: (state) => {
      state.error = null;
    },
    /** Pure reset — in-flight op cancellation is handled in store.js listeners. */
    resetCart: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        // A fetch racing an in-flight/debounced mutation would hydrate stale
        // pre-mutation data and wipe the optimistic update — skip it; the
        // mutation's own response delivers server truth momentarily.
        if (hasPendingCartOps()) return;
        hydrate(state, action.payload?.cart ?? action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message;
      })
      // Every quick* thunk reconciles with server truth on success
      .addMatcher(
        (action) => /^cart\/quick.+\/fulfilled$/.test(action.type),
        (state, action) => {
          if (action.payload?.superseded) return; // newer op owns this line
          hydrate(state, action.payload?.cart ?? action.payload);
        }
      )
      // …and rolls back the failed line only (not the whole cart)
      .addMatcher(
        (action) => /^cart\/quick.+\/rejected$/.test(action.type),
        (state, action) => {
          const { error, prevItems, productId } = action.payload ?? {};
          if (!error) return;
          // Targeted restore: keep whatever newer ops did to OTHER lines.
          if (prevItems && productId) {
            const prevLine = prevItems.find((i) => i.product === productId);
            const currentLine = state.items.find((i) => i.product === productId);
            if (!prevLine) {
              state.items = state.items.filter((i) => i.product !== productId);
            } else if (currentLine) {
              currentLine.qty = prevLine.qty;
            } else {
              state.items.push(prevLine);
            }
          } else if (prevItems) {
            state.items = prevItems; // clear-all failure: full snapshot restore
          }
          recompute(state);
          state.status = 'failed';
          state.error = error.message ?? 'Cart update failed';
        }
      );
  },
});

export const { optimisticAdd, optimisticUpdate, optimisticRemove, optimisticClear, clearError, resetCart } =
  cartSlice.actions;

// ---- Selectors ----
export const selectCartItems = (state) => state.cart.items;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartSubtotal = (state) => state.cart.subtotal;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
/** Per-line op telemetry (in-flight/debouncing) for spinner affordances. */
export const selectCartOps = (state) => ledgerSnapshot();

export default cartSlice.reducer;
