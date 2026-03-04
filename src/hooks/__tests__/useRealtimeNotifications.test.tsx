import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// --- Mocks (vi.mock is hoisted — no external refs allowed) ---------------

let channelCallbacks: Record<string, Function> = {};

vi.mock("@/integrations/supabase/client", () => {
  const channelObj = {
    on: vi.fn(function (this: any, _type: string, config: any, callback: Function) {
      // channelCallbacks is set at runtime in beforeEach via the exported helper
      (globalThis as any).__rtChannelCallbacks ??= {};
      (globalThis as any).__rtChannelCallbacks[config.table] = callback;
      return this;
    }),
    subscribe: vi.fn((cb) => {
      cb?.("SUBSCRIBED");
      return { unsubscribe: vi.fn() };
    }),
  };
  return {
    supabase: {
      channel: vi.fn(() => channelObj),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    profile: { id: "user-1", tenant_id: "tenant-abc", role: "gerant" },
    loading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Import after mocks
import { useRealtimeNotifications } from "../useRealtimeNotifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// --- Helpers --------------------------------------------------------------

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const fire = (table: string, payload: any) => {
  const cb = (globalThis as any).__rtChannelCallbacks?.[table];
  if (cb) cb(payload);
};

// --- Tests ----------------------------------------------------------------

describe("useRealtimeNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__rtChannelCallbacks = {};
  });

  it("should subscribe to realtime channel on mount", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    expect((supabase as any).channel).toHaveBeenCalledWith("realtime-notifications");
  });

  it("should unsubscribe on unmount", () => {
    const { unmount } = renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    unmount();
    expect((supabase as any).removeChannel).toHaveBeenCalled();
  });

  // --- Purchase orders ---

  it("should show success toast when purchase order is approved", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("purchase_orders", {
        eventType: "UPDATE",
        old: { status: "pending" },
        new: { status: "approved", order_number: "BC-042", id: "po-1" },
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Bon de commande validé", expect.objectContaining({ description: expect.stringContaining("BC-042") }));
  });

  it("should show info toast when purchase order is received", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("purchase_orders", {
        eventType: "UPDATE",
        old: { status: "approved" },
        new: { status: "received", order_number: "BC-099", id: "po-2" },
      })
    );
    expect(toast.info).toHaveBeenCalledWith("Réception enregistrée", expect.any(Object));
  });

  it("should NOT toast for irrelevant purchase order status changes", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("purchase_orders", {
        eventType: "UPDATE",
        old: { status: "draft" },
        new: { status: "pending", order_number: "BC-001", id: "po-3" },
      })
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });

  // --- Transactions ---

  it("should notify on important transaction types", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    ["vente", "achat", "salaire", "cession"].forEach((type) => {
      act(() =>
        fire("transactions", {
          eventType: "INSERT",
          new: { transaction_type: type, amount: 50000, description: "Test" },
          old: null,
        })
      );
    });
    expect(toast.info).toHaveBeenCalledTimes(4);
  });

  it("should NOT notify on minor transaction types", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("transactions", {
        eventType: "INSERT",
        new: { transaction_type: "adjustment", amount: 100 },
        old: null,
      })
    );
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("should show success toast when transaction is validated", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("transactions", {
        eventType: "UPDATE",
        new: { is_validated: true, reference: "TRX-001", id: "t-1" },
        old: { is_validated: false },
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Écriture validée", expect.objectContaining({ description: expect.stringContaining("TRX-001") }));
  });

  // --- Accountant notifications ---

  it("should show warning toast for new accountant notifications", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("accountant_notifications", {
        eventType: "INSERT",
        new: { title: "Paie à valider", message: "Équipe A", amount: 120000 },
        old: null,
      })
    );
    expect(toast.warning).toHaveBeenCalledWith("Paie à valider", expect.any(Object));
  });

  // --- Fixed assets ---

  it("should notify when a fixed asset is disposed", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("fixed_assets", {
        eventType: "UPDATE",
        old: { status: "active" },
        new: { status: "disposed", asset_name: "Camion", disposal_type: "vente" },
      })
    );
    expect(toast.info).toHaveBeenCalledWith("Immobilisation cédée", expect.objectContaining({ description: expect.stringContaining("Camion") }));
  });

  it("should NOT notify for non-disposal asset updates", () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: createWrapper() });
    act(() =>
      fire("fixed_assets", {
        eventType: "UPDATE",
        old: { status: "active" },
        new: { status: "active", asset_name: "Camion" },
      })
    );
    expect(toast.info).not.toHaveBeenCalled();
  });
});
