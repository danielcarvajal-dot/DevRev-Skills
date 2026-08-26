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
import {
  demoDoctor,
  demoPharmacy,
  seedDemoDocuments,
  seedDemoNotifications,
  seedDemoOrders,
  seedDemoRefills,
} from "./demo-data";
import { notificationForStatus, refillNotification } from "./operations";
import { PHASE2 } from "./phase2";
import { PRODUCTS as DEFAULT_FORMULARY, getDose, getProduct as findDefault } from "./products";
import type {
  Address,
  CartItem,
  Doctor,
  ExchangeDocument,
  Order,
  OrderStatus,
  PharmacyUser,
  PortalNotification,
  Product,
  RefillRequest,
  RefillStatus,
  SessionUser,
} from "./types";

type Persisted = {
  user: SessionUser | null;
  cart: CartItem[];
  orders: Order[];
  products: Product[];
  scripts: ExchangeDocument[];
  documents: ExchangeDocument[];
  notifications: PortalNotification[];
  refills: RefillRequest[];
};

const emptyState: Persisted = {
  user: null,
  cart: [],
  orders: [],
  products: DEFAULT_FORMULARY,
  scripts: [],
  documents: [],
  notifications: [],
  refills: [],
};

type StoreValue = Persisted & {
  ready: boolean;
  cartCount: number;
  cartTotal: number;
  unreadCount: number;
  signInDoctor: (input: Omit<Doctor, "id" | "createdAt" | "role">) => void;
  signInPharmacy: (input: Omit<PharmacyUser, "id" | "createdAt" | "role">) => void;
  loadDemoDoctor: () => void;
  loadDemoPharmacy: () => void;
  signOut: () => void;
  addToCart: (productId: string, doseId: string, quantity?: number) => void;
  updateQty: (productId: string, doseId: string, quantity: number) => void;
  removeFromCart: (productId: string, doseId: string) => void;
  addScript: (file: ExchangeDocument) => void;
  removeScript: (id: string) => void;
  addDocument: (file: ExchangeDocument) => void;
  placeOrder: (input: {
    address: Address;
    notes: string;
    patientName: string;
    patientDob: string;
  }) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  markNotificationRead: (id: string) => void;
  requestRefill: (orderId: string, notes: string) => RefillRequest | null;
  setRefillStatus: (id: string, status: RefillStatus) => void;
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
      documents: parsed.documents ?? [],
      notifications: parsed.notifications ?? [],
      refills: parsed.refills ?? [],
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

function seedIfEmpty<T>(current: T[], seed: T[]) {
  return current.length ? current : seed;
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
      orders: seedIfEmpty(prev.orders, seedDemoOrders()),
      documents: seedIfEmpty(prev.documents, seedDemoDocuments()),
      notifications: seedIfEmpty(prev.notifications, seedDemoNotifications()),
      refills: seedIfEmpty(prev.refills, seedDemoRefills()),
    }));
  }, [commit]);

  const loadDemoPharmacy = useCallback(() => {
    commit((prev) => ({
      ...prev,
      user: demoPharmacy(),
      orders: seedIfEmpty(prev.orders, seedDemoOrders()),
      documents: seedIfEmpty(prev.documents, seedDemoDocuments()),
      notifications: seedIfEmpty(prev.notifications, seedDemoNotifications()),
      refills: seedIfEmpty(prev.refills, seedDemoRefills()),
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

  const addDocument: StoreValue["addDocument"] = useCallback(
    (file) => {
      commit((prev) => ({ ...prev, documents: [file, ...prev.documents] }));
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
        status: "Submitted",
        address,
        notes,
        patientName,
        patientDob,
        practiceName: doctor?.practiceName || "Unknown practice",
        prescriberName: doctor?.prescriberName || "",
        npi: doctor?.npi || "",
        scripts: state.scripts,
      };
      const receivedNote = notificationForStatus({ ...order, status: "Received" }, "Received");
      commit((prev) => ({
        ...prev,
        cart: [],
        scripts: [],
        documents: [...state.scripts.map((doc) => ({ ...doc, orderId: order.id })), ...prev.documents],
        orders: prev.orders.some((existing) => existing.id === order.id)
          ? prev.orders
          : [order, ...prev.orders],
        notifications: receivedNote ? [receivedNote, ...prev.notifications] : prev.notifications,
      }));
      return order;
    },
    [commit, state.cart, state.products, state.scripts, state.user],
  );

  const setOrderStatus: StoreValue["setOrderStatus"] = useCallback(
    (id, status) => {
      commit((prev) => {
        const order = prev.orders.find((item) => item.id === id);
        if (!order) return prev;
        const note = notificationForStatus({ ...order, status }, status);
        return {
          ...prev,
          orders: prev.orders.map((item) => (item.id === id ? { ...item, status } : item)),
          notifications: note ? [note, ...prev.notifications] : prev.notifications,
        };
      });
    },
    [commit],
  );

  const markNotificationRead: StoreValue["markNotificationRead"] = useCallback(
    (id) => {
      commit((prev) => ({
        ...prev,
        notifications: prev.notifications.map((note) =>
          note.id === id ? { ...note, read: true } : note,
        ),
      }));
    },
    [commit],
  );

  const requestRefill: StoreValue["requestRefill"] = useCallback(
    (orderId, notes) => {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return null;
      const refill: RefillRequest = {
        id: crypto.randomUUID(),
        orderId,
        patientName: order.patientName,
        summary: order.items.map((item) => `${item.productName} ${item.doseLabel}`).join(" · "),
        notes,
        requestedAt: new Date().toISOString(),
        status: "Submitted",
      };
      commit((prev) => ({ ...prev, refills: [refill, ...prev.refills] }));
      return refill;
    },
    [commit, state.orders],
  );

  const setRefillStatus: StoreValue["setRefillStatus"] = useCallback(
    (id, status) => {
      commit((prev) => {
        const refill = prev.refills.find((item) => item.id === id);
        if (!refill) return prev;
        const next = { ...refill, status };
        return {
          ...prev,
          refills: prev.refills.map((item) => (item.id === id ? next : item)),
          notifications: [refillNotification(next), ...prev.notifications],
        };
      });
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
  const unreadCount = state.notifications.filter((note) => !note.read).length;

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      cartCount,
      cartTotal,
      unreadCount,
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
      addDocument,
      placeOrder,
      setOrderStatus,
      markNotificationRead,
      requestRefill,
      setRefillStatus,
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
      unreadCount,
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
      addDocument,
      placeOrder,
      setOrderStatus,
      markNotificationRead,
      requestRefill,
      setRefillStatus,
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
