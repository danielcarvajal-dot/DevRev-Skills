"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { demoPatient, seedDemoOrders } from "./demo-data";
import { getDose, getProduct } from "./products";
import type { Address, CartItem, Order, Patient } from "./types";

const STORAGE_KEY = "isosure.patient.v1";

type Persisted = {
  patient: Patient | null;
  cart: CartItem[];
  orders: Order[];
};

const emptyState: Persisted = { patient: null, cart: [], orders: [] };

type StoreValue = Persisted & {
  ready: boolean;
  cartCount: number;
  cartTotal: number;
  signIn: (patient: Omit<Patient, "id" | "createdAt"> & { id?: string }) => void;
  loadDemo: () => void;
  signOut: () => void;
  updatePatient: (patch: Partial<Patient>) => void;
  addToCart: (productId: string, doseId: string, quantity?: number) => void;
  updateQty: (productId: string, doseId: string, quantity: number) => void;
  removeFromCart: (productId: string, doseId: string) => void;
  clearCart: () => void;
  placeOrder: (address: Address, notes: string) => Order;
};

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): Persisted {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Persisted;
    return {
      patient: parsed.patient ?? null,
      cart: parsed.cart ?? [],
      orders: parsed.orders ?? [],
    };
  } catch {
    return emptyState;
  }
}

function persist(state: Persisted) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function lineTotal(item: CartItem) {
  const product = getProduct(item.productId);
  if (!product) return 0;
  const dose = getDose(product, item.doseId);
  return (dose?.price ?? 0) * item.quantity;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is client-only; hydrate after mount to keep SSR markup stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client hydration
    setState(loadState());
    setReady(true);
  }, []);

  const commit = useCallback((recipe: (prev: Persisted) => Persisted) => {
    setState((prev) => {
      const next = recipe(prev);
      persist(next);
      return next;
    });
  }, []);

  const signIn: StoreValue["signIn"] = useCallback(
    (input) => {
      const patient: Patient = {
        id: input.id ?? crypto.randomUUID(),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        createdAt: new Date().toISOString(),
      };
      commit((prev) => ({ ...prev, patient }));
    },
    [commit],
  );

  const loadDemo = useCallback(() => {
    commit((prev) => ({
      patient: {
        ...demoPatient(),
        id: "demo-avery",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
      },
      cart: prev.cart,
      orders: seedDemoOrders(),
    }));
  }, [commit]);

  const signOut = useCallback(() => {
    commit((prev) => ({ ...prev, patient: null }));
  }, [commit]);

  const updatePatient: StoreValue["updatePatient"] = useCallback(
    (patch) => {
      commit((prev) => {
        if (!prev.patient) return prev;
        return { ...prev, patient: { ...prev.patient, ...patch } };
      });
    },
    [commit],
  );

  const addToCart: StoreValue["addToCart"] = useCallback(
    (productId, doseId, quantity = 1) => {
      commit((prev) => {
        const existing = prev.cart.find(
          (item) => item.productId === productId && item.doseId === doseId,
        );
        const cart = existing
          ? prev.cart.map((item) =>
              item.productId === productId && item.doseId === doseId
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          : [...prev.cart, { productId, doseId, quantity }];
        return { ...prev, cart };
      });
    },
    [commit],
  );

  const updateQty: StoreValue["updateQty"] = useCallback(
    (productId, doseId, quantity) => {
      commit((prev) => {
        const cart =
          quantity <= 0
            ? prev.cart.filter(
                (item) => !(item.productId === productId && item.doseId === doseId),
              )
            : prev.cart.map((item) =>
                item.productId === productId && item.doseId === doseId
                  ? { ...item, quantity }
                  : item,
              );
        return { ...prev, cart };
      });
    },
    [commit],
  );

  const removeFromCart: StoreValue["removeFromCart"] = useCallback(
    (productId, doseId) => {
      commit((prev) => ({
        ...prev,
        cart: prev.cart.filter(
          (item) => !(item.productId === productId && item.doseId === doseId),
        ),
      }));
    },
    [commit],
  );

  const clearCart = useCallback(() => {
    commit((prev) => ({ ...prev, cart: [] }));
  }, [commit]);

  const placeOrder: StoreValue["placeOrder"] = useCallback(
    (address, notes) => {
      const items = state.cart
        .map((item) => {
          const product = getProduct(item.productId);
          const dose = product ? getDose(product, item.doseId) : undefined;
          if (!product || !dose) return null;
          return {
            ...item,
            productName: product.name,
            doseLabel: dose.label,
            unitPrice: dose.price,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const shipping = subtotal >= 75 ? 0 : 8;
      const order: Order = {
        id: crypto.randomUUID(),
        placedAt: new Date().toISOString(),
        items,
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: "Received",
        address,
        notes,
      };
      commit((prev) => ({
        ...prev,
        cart: [],
        orders: prev.orders.some((existing) => existing.id === order.id)
          ? prev.orders
          : [order, ...prev.orders],
      }));
      return order;
    },
    [commit, state.cart],
  );

  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = state.cart.reduce((sum, item) => sum + lineTotal(item), 0);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      cartCount,
      cartTotal,
      signIn,
      loadDemo,
      signOut,
      updatePatient,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      placeOrder,
    }),
    [
      state,
      ready,
      cartCount,
      cartTotal,
      signIn,
      loadDemo,
      signOut,
      updatePatient,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      placeOrder,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
