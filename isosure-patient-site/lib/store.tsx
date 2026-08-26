"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { productFromPartial } from "./catalog-io";
import { demoDoctor, demoPharmacy, seedDemoOrders } from "./demo-data";
import { PHASE2 } from "./phase2";
import { PRODUCTS as DEFAULT_FORMULARY } from "./products";
import { getDose, getProduct as findDefault } from "./products";
import type {
  Address,
  CartItem,
  Doctor,
  Order,
  OrderStatus,
  PharmacyUser,
  Product,
  ScriptFile,
  SessionUser,
} from "./types";

type Persisted = {
  user: SessionUser | null;
  cart: CartItem[];
  orders: Order[];
  products: Product[];
  scripts: ScriptFile[];
};

const emptyState: Persisted = {
  user: null,
  cart: [],
  orders: [],
  products: DEFAULT_FORMULARY,
  scripts: [],
};

type StoreValue = Persisted & {
  ready: boolean;
  cartCount: number;
  cartTotal: number;
  signInDoctor: (input: Omit<Doctor, "id" | "createdAt" | "role">) => void;
  signInPharmacy: (input: Omit<PharmacyUser, "id" | "createdAt" | "role">) => void;
  loadDemoDoctor: () => void;
  loadDemoPharmacy: () => void;
  signOut: () => void;
  addToCart: (productId: string, doseId: string, quantity?: number) => void;
  updateQty: (productId: string, doseId: string, quantity: number) => void;
  removeFromCart: (productId: string, doseId: string) => void;
  addScript: (file: ScriptFile) => void;
  removeScript: (id: string) => void;
  placeOrder: (input: {
    address: Address;
    notes: string;
    patientName: string;
    patientDob: string;
  }) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  replaceFormulary: (products: Product[]) => void;
  getProduct: (idOrSlug: string) => Product | undefined;
};

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): Persisted {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(PHASE2.storageKey);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      user: parsed.user ?? null,
      cart: parsed.cart ?? [],
      orders: parsed.orders ?? [],
      products: parsed.products?.length ? parsed.products : DEFAULT_FORMULARY,
      scripts: parsed.scripts ?? [],
    };
  } catch {
    return emptyState;
  }
}

function persist(state: Persisted) {
  window.localStorage.setItem(PHASE2.storageKey, JSON.stringify(state));
}

function lineTotal(item: CartItem, products: Product[]) {
  const product = products.find((p) => p.id === item.productId);
  if (!product) return 0;
  const dose = product.doses.find((d) => d.id === item.doseId);
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

  const signInDoctor: StoreValue["signInDoctor"] = useCallback(
    (input) => {
      commit((prev) => ({
        ...prev,
        user: {
          ...input,
          id: crypto.randomUUID(),
          role: "doctor",
          createdAt: new Date().toISOString(),
        },
      }));
    },
    [commit],
  );

  const signInPharmacy: StoreValue["signInPharmacy"] = useCallback(
    (input) => {
      commit((prev) => ({
        ...prev,
        user: {
          ...input,
          id: crypto.randomUUID(),
          role: "pharmacy",
          createdAt: new Date().toISOString(),
        },
      }));
    },
    [commit],
  );

  const loadDemoDoctor = useCallback(() => {
    commit((prev) => ({
      ...prev,
      user: demoDoctor(),
      orders: prev.orders.length ? prev.orders : seedDemoOrders(),
    }));
  }, [commit]);

  const loadDemoPharmacy = useCallback(() => {
    commit((prev) => ({
      ...prev,
      user: demoPharmacy(),
      orders: prev.orders.length ? prev.orders : seedDemoOrders(),
    }));
  }, [commit]);

  const signOut = useCallback(() => {
    commit((prev) => ({ ...prev, user: null }));
  }, [commit]);

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
      commit((prev) => ({
        ...prev,
        cart:
          quantity <= 0
            ? prev.cart.filter(
                (item) => !(item.productId === productId && item.doseId === doseId),
              )
            : prev.cart.map((item) =>
                item.productId === productId && item.doseId === doseId
                  ? { ...item, quantity }
                  : item,
              ),
      }));
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

  const addScript: StoreValue["addScript"] = useCallback(
    (file) => {
      commit((prev) => ({ ...prev, scripts: [...prev.scripts, file] }));
    },
    [commit],
  );

  const removeScript: StoreValue["removeScript"] = useCallback(
    (id) => {
      commit((prev) => ({ ...prev, scripts: prev.scripts.filter((s) => s.id !== id) }));
    },
    [commit],
  );

  const placeOrder: StoreValue["placeOrder"] = useCallback(
    ({ address, notes, patientName, patientDob }) => {
      const doctor = state.user?.role === "doctor" ? state.user : null;
      const items = state.cart
        .map((item) => {
          const product = state.products.find((p) => p.id === item.productId);
          const dose = product?.doses.find((d) => d.id === item.doseId);
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
        patientName,
        patientDob,
        practiceName: doctor?.practiceName || "Unknown practice",
        prescriberName: doctor?.prescriberName || "",
        npi: doctor?.npi || "",
        scripts: state.scripts,
      };
      commit((prev) => ({
        ...prev,
        cart: [],
        scripts: [],
        orders: prev.orders.some((existing) => existing.id === order.id)
          ? prev.orders
          : [order, ...prev.orders],
      }));
      return order;
    },
    [commit, state.cart, state.products, state.scripts, state.user],
  );

  const setOrderStatus: StoreValue["setOrderStatus"] = useCallback(
    (id, status) => {
      commit((prev) => ({
        ...prev,
        orders: prev.orders.map((order) => (order.id === id ? { ...order, status } : order)),
      }));
    },
    [commit],
  );

  const upsertProduct: StoreValue["upsertProduct"] = useCallback(
    (product) => {
      const next = productFromPartial(product);
      commit((prev) => {
        const exists = prev.products.some((item) => item.id === next.id);
        return {
          ...prev,
          products: exists
            ? prev.products.map((item) => (item.id === next.id ? next : item))
            : [...prev.products, next],
        };
      });
    },
    [commit],
  );

  const removeProduct: StoreValue["removeProduct"] = useCallback(
    (id) => {
      commit((prev) => ({ ...prev, products: prev.products.filter((item) => item.id !== id) }));
    },
    [commit],
  );

  const replaceFormulary: StoreValue["replaceFormulary"] = useCallback(
    (products) => {
      commit((prev) => ({ ...prev, products: products.map(productFromPartial) }));
    },
    [commit],
  );

  const getProduct = useCallback(
    (idOrSlug: string) =>
      state.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ||
      findDefault(idOrSlug),
    [state.products],
  );

  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = state.cart.reduce((sum, item) => sum + lineTotal(item, state.products), 0);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      cartCount,
      cartTotal,
      signInDoctor,
      signInPharmacy,
      loadDemoDoctor,
      loadDemoPharmacy,
      signOut,
      addToCart,
      updateQty,
      removeFromCart,
      addScript,
      removeScript,
      placeOrder,
      setOrderStatus,
      upsertProduct,
      removeProduct,
      replaceFormulary,
      getProduct,
    }),
    [
      state,
      ready,
      cartCount,
      cartTotal,
      signInDoctor,
      signInPharmacy,
      loadDemoDoctor,
      loadDemoPharmacy,
      signOut,
      addToCart,
      updateQty,
      removeFromCart,
      addScript,
      removeScript,
      placeOrder,
      setOrderStatus,
      upsertProduct,
      removeProduct,
      replaceFormulary,
      getProduct,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { getDose };
