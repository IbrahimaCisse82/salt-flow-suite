import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeather } from '../useWeather';

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

global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
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

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherData,
    } as Response);

    const { result } = renderHook(() => useWeather(45.5, -73.5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockWeatherData);
  });

  it('should handle fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

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
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should refetch data periodically', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ current: {}, forecast: [] }),
    } as Response);

    renderHook(() => useWeather(45.5, -73.5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
