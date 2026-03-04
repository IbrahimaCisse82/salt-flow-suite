import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// --- Mock data ---

const mockBudgetData = [
  {
    campagne_id: "c-1",
    phase: "Récolte",
    expense_category: "Main d'œuvre",
    budgeted_amount: 100000,
    committed_amount: 95000,
    engagement_rate: 95,
    alert_level: 2,
    remaining_to_commit: 5000,
  },
  {
    campagne_id: "c-1",
    phase: "Préparation",
    expense_category: "Transport",
    budgeted_amount: 50000,
    committed_amount: 42000,
    engagement_rate: 84,
    alert_level: 1,
    remaining_to_commit: 8000,
  },
  {
    campagne_id: "c-1",
    phase: "Stockage",
    expense_category: "Énergie",
    budgeted_amount: 30000,
    committed_amount: 10000,
    engagement_rate: 33,
    alert_level: 0,
    remaining_to_commit: 20000,
  },
];

const mockSelect = vi.fn().mockReturnThis();
const mockGt = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockResolvedValue({
  data: mockBudgetData.filter((d) => d.alert_level > 0),
  error: null,
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      gt: mockGt,
      order: mockOrder,
    })),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    profile: { id: "user-1", tenant_id: "tenant-abc", role: "gerant" },
    loading: false,
  }),
}));

import { useBudgetAlerts } from "../useBudgetAlerts";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useBudgetAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({
      data: mockBudgetData.filter((d) => d.alert_level > 0),
      error: null,
    });
  });

  it("should fetch and categorise budget alerts", async () => {
    const { result } = renderHook(() => useBudgetAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Only alert_level > 0 rows returned (2 out of 3)
    expect(result.current.alerts).toHaveLength(2);
    expect(result.current.criticalAlerts).toHaveLength(1);
    expect(result.current.warningAlerts).toHaveLength(1);
    expect(result.current.hasCritical).toBe(true);
    expect(result.current.hasWarning).toBe(true);
  });

  it("should map fields correctly for critical alert", async () => {
    const { result } = renderHook(() => useBudgetAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const critical = result.current.criticalAlerts[0];
    expect(critical.phase).toBe("Récolte");
    expect(critical.expense_category).toBe("Main d'œuvre");
    expect(critical.budgeted_amount).toBe(100000);
    expect(critical.committed_amount).toBe(95000);
    expect(critical.engagement_rate).toBe(95);
    expect(critical.remaining).toBe(5000);
    expect(critical.alert_level).toBe(2);
  });

  it("should map fields correctly for warning alert", async () => {
    const { result } = renderHook(() => useBudgetAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const warning = result.current.warningAlerts[0];
    expect(warning.phase).toBe("Préparation");
    expect(warning.engagement_rate).toBe(84);
    expect(warning.alert_level).toBe(1);
  });

  it("should return empty arrays when no alerts", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useBudgetAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.alerts).toHaveLength(0);
    expect(result.current.criticalAlerts).toHaveLength(0);
    expect(result.current.warningAlerts).toHaveLength(0);
    expect(result.current.hasCritical).toBe(false);
    expect(result.current.hasWarning).toBe(false);
  });

  it("should handle Supabase errors gracefully", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "Network error" },
    });

    const { result } = renderHook(() => useBudgetAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.alerts).toHaveLength(0);
    expect(result.current.hasCritical).toBe(false);
  });

  it("should generate composite IDs for alerts", async () => {
    const { result } = renderHook(() => useBudgetAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.alerts[0].id).toBe("c-1-Récolte-Main d'œuvre");
    expect(result.current.alerts[1].id).toBe("c-1-Préparation-Transport");
  });
});
