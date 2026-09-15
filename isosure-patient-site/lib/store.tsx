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
  demoFacility,
  demoPharmacy,
  seedDemoDocuments,
  seedDemoNotifications,
  seedDemoOrders,
  seedDemoPatients,
  seedDemoRefills,
} from "./demo-data";
import { canSubmitOrder, evaluateOrderAlerts } from "./order-alerts";
import { orderableMeta } from "./orderables";
import { patientDisplayName, shippingAddress } from "./patients";
import {
  INGREDIENTS as DEFAULT_INGREDIENTS,
  MFRS as DEFAULT_MFRS,
  seedCsLogs,
  seedEquipmentLogs,
  seedEnvironmentLogs,
  seedLots,
} from "./lims-catalog";
import { aggregateOrderStatus, createCrsForOrder, seedDemoCrs, advanceCr as stepCr } from "./lims";
import type {
  CompoundingRecord,
  ControlledSubstanceLog,
  EnvironmentLog,
  EquipmentLog,
  Ingredient,
  InventoryLot,
  MasterFormulationRecord,
} from "./lims-types";
import { notificationForStatus, refillNotification } from "./operations";
import { PHASE2 } from "./phase2";
import { PRODUCTS as DEFAULT_FORMULARY, getDose, getProduct as findDefault } from "./products";
import type {
  Address,
  CartItem,
  Doctor,
  ExchangeDocument,
  Order,
  OrderDraft,
  OrderStatus,
  Patient,
  PharmacyUser,
  PortalNotification,
  Prescription,
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
  patients: Patient[];
  drafts: OrderDraft[];
  scripts: ExchangeDocument[];
  documents: ExchangeDocument[];
  notifications: PortalNotification[];
  refills: RefillRequest[];
  ingredients: Ingredient[];
  lots: InventoryLot[];
  mfrs: MasterFormulationRecord[];
  crs: CompoundingRecord[];
  envLogs: EnvironmentLog[];
  equipmentLogs: EquipmentLog[];
  csLogs: ControlledSubstanceLog[];
};

const emptyState: Persisted = {
  user: null,
  cart: [],
  orders: [],
  products: DEFAULT_FORMULARY,
  patients: [],
  drafts: [],
  scripts: [],
  documents: [],
  notifications: [],
  refills: [],
  ingredients: DEFAULT_INGREDIENTS,
  lots: [],
  mfrs: DEFAULT_MFRS,
  crs: [],
  envLogs: [],
  equipmentLogs: [],
  csLogs: [],
};

type StoreValue = Persisted & {
  ready: boolean;
  cartCount: number;
  cartTotal: number;
  unreadCount: number;
  signInDoctor: (input: Omit<Doctor, "id" | "createdAt" | "role">) => void;
  signInPharmacy: (input: Omit<PharmacyUser, "id" | "createdAt" | "role">) => void;
  loadDemoDoctor: () => void;
  loadDemoFacility: () => void;
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
  upsertPatient: (patient: Patient) => Patient;
  saveDraft: (draft: OrderDraft) => void;
  deleteDraft: (id: string) => void;
  submitMedicationOrder: (input: {
    patientId: string;
    prescription: Prescription;
    acknowledgedAlertIds: string[];
    draftId?: string;
  }) => { ok: true; order: Order } | { ok: false; error: string };
  assignMfr: (crId: string, mfrId: string) => void;
  advanceBatch: (crId: string) => string | null;
  addEnvironmentLog: (log: Omit<EnvironmentLog, "id">) => void;
  addEquipmentLog: (log: Omit<EquipmentLog, "id">) => void;
  receiveLot: (lot: Omit<InventoryLot, "id" | "remaining">) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function mergeFormulary(stored: Product[] | undefined) {
  if (!stored?.length) return DEFAULT_FORMULARY;
  const byId = new Map(stored.map((item) => [item.id, productFromPartial(item)]));
  for (const product of DEFAULT_FORMULARY) {
    if (!byId.has(product.id)) byId.set(product.id, product);
  }
  return [...byId.values()];
}

function loadState(): Persisted {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw =
      window.localStorage.getItem(PHASE2.storageKey) ||
      window.localStorage.getItem(PHASE2.previousStorageKey);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      user: parsed.user ?? null,
      cart: parsed.cart ?? [],
      orders: parsed.orders ?? [],
      products: mergeFormulary(parsed.products),
      patients: parsed.patients ?? [],
      drafts: parsed.drafts ?? [],
      scripts: parsed.scripts ?? [],
      documents: parsed.documents ?? [],
      notifications: parsed.notifications ?? [],
      refills: parsed.refills ?? [],
      ingredients: parsed.ingredients?.length ? parsed.ingredients : DEFAULT_INGREDIENTS,
      lots: parsed.lots ?? [],
      mfrs: parsed.mfrs?.length ? parsed.mfrs : DEFAULT_MFRS,
      crs: parsed.crs ?? [],
      envLogs: parsed.envLogs ?? [],
      equipmentLogs: parsed.equipmentLogs ?? [],
      csLogs: parsed.csLogs ?? [],
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

  const seedPortalDemo = useCallback(
    (user: ReturnType<typeof demoDoctor>) => {
      commit((prev) => ({
        ...prev,
        user,
        orders: seedIfEmpty(prev.orders, seedDemoOrders()),
        patients: seedIfEmpty(prev.patients, seedDemoPatients()),
        documents: seedIfEmpty(prev.documents, seedDemoDocuments()),
        notifications: seedIfEmpty(prev.notifications, seedDemoNotifications()),
        refills: seedIfEmpty(prev.refills, seedDemoRefills()),
        lots: seedIfEmpty(prev.lots, seedLots()),
        crs: seedIfEmpty(prev.crs, seedDemoCrs()),
        envLogs: seedIfEmpty(prev.envLogs, seedEnvironmentLogs()),
        equipmentLogs: seedIfEmpty(prev.equipmentLogs, seedEquipmentLogs()),
        csLogs: seedIfEmpty(prev.csLogs, seedCsLogs()),
        ingredients: prev.ingredients.length ? prev.ingredients : DEFAULT_INGREDIENTS,
        mfrs: prev.mfrs.length ? prev.mfrs : DEFAULT_MFRS,
      }));
    },
    [commit],
  );

  const loadDemoDoctor = useCallback(() => {
    seedPortalDemo(demoDoctor());
  }, [seedPortalDemo]);

  const loadDemoFacility = useCallback(() => {
    seedPortalDemo(demoFacility());
  }, [seedPortalDemo]);

  const loadDemoPharmacy = useCallback(() => {
    commit((prev) => ({
      ...prev,
      user: demoPharmacy(),
      orders: seedIfEmpty(prev.orders, seedDemoOrders()),
      patients: seedIfEmpty(prev.patients, seedDemoPatients()),
      documents: seedIfEmpty(prev.documents, seedDemoDocuments()),
      notifications: seedIfEmpty(prev.notifications, seedDemoNotifications()),
      refills: seedIfEmpty(prev.refills, seedDemoRefills()),
      lots: seedIfEmpty(prev.lots, seedLots()),
      crs: seedIfEmpty(prev.crs, seedDemoCrs()),
      envLogs: seedIfEmpty(prev.envLogs, seedEnvironmentLogs()),
      equipmentLogs: seedIfEmpty(prev.equipmentLogs, seedEquipmentLogs()),
      csLogs: seedIfEmpty(prev.csLogs, seedCsLogs()),
      ingredients: prev.ingredients.length ? prev.ingredients : DEFAULT_INGREDIENTS,
      mfrs: prev.mfrs.length ? prev.mfrs : DEFAULT_MFRS,
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
      const pharmacist = "ISOSure lab";
      commit((prev) => {
        const crs = createCrsForOrder({
          order,
          mfrs: prev.mfrs.length ? prev.mfrs : DEFAULT_MFRS,
          ingredients: prev.ingredients.length ? prev.ingredients : DEFAULT_INGREDIENTS,
          pharmacist,
        });
        return {
          ...prev,
          cart: [],
          scripts: [],
          documents: [...state.scripts.map((doc) => ({ ...doc, orderId: order.id })), ...prev.documents],
          orders: prev.orders.some((existing) => existing.id === order.id)
            ? prev.orders
            : [order, ...prev.orders],
          notifications: receivedNote ? [receivedNote, ...prev.notifications] : prev.notifications,
          crs: [...crs, ...prev.crs],
          lots: prev.lots.length ? prev.lots : seedLots(),
          mfrs: prev.mfrs.length ? prev.mfrs : DEFAULT_MFRS,
          ingredients: prev.ingredients.length ? prev.ingredients : DEFAULT_INGREDIENTS,
        };
      });
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

  const upsertPatient: StoreValue["upsertPatient"] = useCallback(
    (patient) => {
      const next: Patient = {
        ...patient,
        id: patient.id || crypto.randomUUID(),
        createdAt: patient.createdAt || new Date().toISOString(),
      };
      commit((prev) => {
        const exists = prev.patients.some((item) => item.id === next.id);
        return {
          ...prev,
          patients: exists
            ? prev.patients.map((item) => (item.id === next.id ? next : item))
            : [next, ...prev.patients],
        };
      });
      return next;
    },
    [commit],
  );

  const saveDraft: StoreValue["saveDraft"] = useCallback(
    (draft) => {
      if (!draft.patientId && !draft.prescription.productId) return;
      commit((prev) => {
        const next = { ...draft, updatedAt: new Date().toISOString() };
        const exists = prev.drafts.some((item) => item.id === next.id);
        return {
          ...prev,
          drafts: exists
            ? prev.drafts.map((item) => (item.id === next.id ? next : item))
            : [next, ...prev.drafts],
        };
      });
    },
    [commit],
  );

  const deleteDraft: StoreValue["deleteDraft"] = useCallback(
    (id) => {
      commit((prev) => ({ ...prev, drafts: prev.drafts.filter((item) => item.id !== id) }));
    },
    [commit],
  );

  const submitMedicationOrder: StoreValue["submitMedicationOrder"] = useCallback(
    ({ patientId, prescription, acknowledgedAlertIds, draftId }) => {
      const doctor = state.user?.role === "doctor" ? state.user : null;
      const patient = state.patients.find((item) => item.id === patientId) || null;
      const product = state.products.find((item) => item.id === prescription.productId);
      const dose = product?.doses.find((item) => item.id === prescription.doseId) || null;
      const alerts = evaluateOrderAlerts({
        patient,
        product: product || null,
        dose,
        prescription,
        orders: state.orders,
      });
      if (!canSubmitOrder(alerts, acknowledgedAlertIds)) {
        const blocker = alerts.find((item) => item.severity === "block");
        return { ok: false as const, error: blocker?.body || "Review and acknowledge alerts before submitting." };
      }
      if (!doctor || !patient || !product || !dose) {
        return { ok: false as const, error: "Provider login, patient, and medication are required." };
      }
      const meta = orderableMeta(product);
      const unitPrice = dose.price;
      const quantity = Number(prescription.quantity) || 1;
      const item = {
        productId: product.id,
        doseId: dose.id,
        quantity,
        productName: product.name,
        doseLabel: dose.label,
        unitPrice,
      };
      const subtotal = unitPrice * quantity;
      const shipping = subtotal >= 75 ? 0 : 8;
      const order: Order = {
        id: crypto.randomUUID(),
        placedAt: new Date().toISOString(),
        items: [item],
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: "Submitted",
        address: shippingAddress(patient, doctor.practiceName),
        notes: prescription.notes,
        patientName: patientDisplayName(patient),
        patientDob: patient.dob,
        patientId: patient.id,
        practiceName: doctor.practiceName,
        prescriberName: doctor.prescriberName,
        npi: doctor.npi,
        scripts: [],
        prescription: {
          ...prescription,
          quantityUnit: prescription.quantityUnit || meta.quantityUnit,
        },
      };
      const receivedNote = notificationForStatus({ ...order, status: "Received" }, "Received");
      const pharmacist = "ISOSure lab";
      commit((prev) => {
        const crs = createCrsForOrder({
          order,
          mfrs: prev.mfrs.length ? prev.mfrs : DEFAULT_MFRS,
          ingredients: prev.ingredients.length ? prev.ingredients : DEFAULT_INGREDIENTS,
          pharmacist,
        });
        return {
          ...prev,
          drafts: draftId ? prev.drafts.filter((item) => item.id !== draftId) : prev.drafts,
          orders: [order, ...prev.orders],
          notifications: receivedNote ? [receivedNote, ...prev.notifications] : prev.notifications,
          crs: [...crs, ...prev.crs],
          lots: prev.lots.length ? prev.lots : seedLots(),
          mfrs: prev.mfrs.length ? prev.mfrs : DEFAULT_MFRS,
          ingredients: prev.ingredients.length ? prev.ingredients : DEFAULT_INGREDIENTS,
        };
      });
      return { ok: true as const, order };
    },
    [commit, state.orders, state.patients, state.products, state.user],
  );

  const assignMfr: StoreValue["assignMfr"] = useCallback(
    (crId, mfrId) => {
      commit((prev) => ({
        ...prev,
        crs: prev.crs.map((item) => (item.id === crId ? { ...item, mfrId } : item)),
      }));
    },
    [commit],
  );

  const advanceBatch: StoreValue["advanceBatch"] = useCallback(
    (crId) => {
      let error: string | null = null;
      commit((prev) => {
        const cr = prev.crs.find((item) => item.id === crId);
        if (!cr) {
          error = "Batch not found.";
          return prev;
        }
        const pharmacist = prev.user?.role === "pharmacy" ? prev.user.contactName : "ISOSure lab";
        const stepped = stepCr({
          cr,
          mfrs: prev.mfrs,
          lots: prev.lots,
          ingredients: prev.ingredients,
          pharmacist,
        });
        if (stepped.error) {
          error = stepped.error;
          return prev;
        }
        const crs = prev.crs.map((item) => (item.id === crId ? stepped.cr : item));
        const related = crs.filter((item) => item.orderId === cr.orderId);
        const nextStatus = aggregateOrderStatus(related.map((item) => item.stage));
        const order = prev.orders.find((item) => item.id === cr.orderId);
        const statusChanged = nextStatus && order && order.status !== nextStatus;
        const note =
          statusChanged && order ? notificationForStatus({ ...order, status: nextStatus }, nextStatus) : null;
        return {
          ...prev,
          crs,
          lots: stepped.lots,
          csLogs: [...stepped.csLogs, ...prev.csLogs],
          orders: nextStatus
            ? prev.orders.map((item) => (item.id === cr.orderId ? { ...item, status: nextStatus } : item))
            : prev.orders,
          notifications: note ? [note, ...prev.notifications] : prev.notifications,
        };
      });
      return error;
    },
    [commit],
  );

  const addEnvironmentLog: StoreValue["addEnvironmentLog"] = useCallback(
    (log) => {
      commit((prev) => ({
        ...prev,
        envLogs: [{ ...log, id: crypto.randomUUID() }, ...prev.envLogs],
      }));
    },
    [commit],
  );

  const addEquipmentLog: StoreValue["addEquipmentLog"] = useCallback(
    (log) => {
      commit((prev) => ({
        ...prev,
        equipmentLogs: [{ ...log, id: crypto.randomUUID() }, ...prev.equipmentLogs],
      }));
    },
    [commit],
  );

  const receiveLot: StoreValue["receiveLot"] = useCallback(
    (lot) => {
      commit((prev) => ({
        ...prev,
        lots: [
          {
            ...lot,
            id: crypto.randomUUID(),
            remaining: lot.quantity,
          },
          ...prev.lots,
        ],
      }));
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
      loadDemoFacility,
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
      upsertPatient,
      saveDraft,
      deleteDraft,
      submitMedicationOrder,
      assignMfr,
      advanceBatch,
      addEnvironmentLog,
      addEquipmentLog,
      receiveLot,
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
      loadDemoFacility,
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
      upsertPatient,
      saveDraft,
      deleteDraft,
      submitMedicationOrder,
      assignMfr,
      advanceBatch,
      addEnvironmentLog,
      addEquipmentLog,
      receiveLot,
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
