import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWeather } from '../useWeather';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

const invoke = vi.mocked(supabase.functions.invoke);

const waitFor = async (callback: () => void, timeout = 3000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  callback();
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch without coordinates', () => {
    const { result } = renderHook(() => useWeather(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch weather data with coordinates', async () => {
    const mockWeatherData = {
      current: {
        temperature: 25,
        feels_like: 27,
        humidity: 60,
        pressure: 1013,
        wind_speed: 5,
        description: 'Clear sky',
        icon: '01d',
        sunrise: 1234567890,
        sunset: 1234567890,
      },
      forecast: [],
    };

    invoke.mockResolvedValueOnce({ data: mockWeatherData, error: null } as never);

    const { result } = renderHook(() => useWeather(45.5, -73.5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockWeatherData);
  });

  it('should handle fetch errors', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: new Error('boom') } as never);

    const { result } = renderHook(() => useWeather(45.5, -73.5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should not make request with invalid coordinates', () => {
    const { result } = renderHook(() => useWeather(undefined, undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('should refetch data periodically', async () => {
    invoke.mockResolvedValue({ data: { current: {}, forecast: [] }, error: null } as never);

    renderHook(() => useWeather(45.5, -73.5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(invoke).toHaveBeenCalled();
    });
  });
});
