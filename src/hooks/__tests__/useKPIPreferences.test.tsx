import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKPIPreferences } from '../useKPIPreferences';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useKPIPreferences', () => {
  const mockProfile = {
    id: 'user-123',
    tenant_id: 'tenant-123',
    role: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: mockProfile,
      user: { id: 'user-123' },
    } as any);
  });

  it('should initialize with default KPI configs', () => {
    const { result } = renderHook(() => useKPIPreferences());
    
    expect(result.current.kpiConfigs).toHaveLength(8);
    expect(result.current.kpiConfigs[0].id).toBe('production_totale');
  });

  it('should load saved preferences from localStorage', () => {
    const savedPrefs = [
      {
        id: 'production_totale',
        enabled: false,
        order: 1,
        label: 'Production totale',
        description: 'Test'
      }
    ];
    localStorage.setItem('kpi_preferences_user-123', JSON.stringify(savedPrefs));

    const { result } = renderHook(() => useKPIPreferences());
    
    expect(result.current.kpiConfigs[0].enabled).toBe(false);
  });

  it('should toggle KPI enabled state', () => {
    const { result } = renderHook(() => useKPIPreferences());
    
    const initialState = result.current.kpiConfigs[0].enabled;
    
    act(() => {
      result.current.toggleKPI('production_totale');
    });

    expect(result.current.kpiConfigs[0].enabled).toBe(!initialState);
  });

  it('should reorder KPIs', () => {
    const { result } = renderHook(() => useKPIPreferences());
    
    const firstId = result.current.kpiConfigs[0].id;
    const secondId = result.current.kpiConfigs[1].id;
    
    act(() => {
      result.current.reorderKPIs(0, 1);
    });

    expect(result.current.kpiConfigs[0].id).toBe(secondId);
    expect(result.current.kpiConfigs[1].id).toBe(firstId);
  });

  it('should reset to default preferences', () => {
    const { result } = renderHook(() => useKPIPreferences());
    
    act(() => {
      result.current.toggleKPI('production_totale');
    });
    
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.kpiConfigs[0].enabled).toBe(true);
  });

  it('should return only enabled KPIs', () => {
    const { result } = renderHook(() => useKPIPreferences());
    
    const enabledCount = result.current.kpiConfigs.filter(k => k.enabled).length;
    expect(result.current.enabledKPIs).toHaveLength(enabledCount);
  });

  it('should save preferences to localStorage', () => {
    const { result } = renderHook(() => useKPIPreferences());
    
    act(() => {
      result.current.toggleKPI('production_totale');
    });

    const saved = localStorage.getItem('kpi_preferences_user-123');
    expect(saved).toBeTruthy();
    
    const parsed = JSON.parse(saved!);
    expect(parsed[0].id).toBe('production_totale');
  });
});
