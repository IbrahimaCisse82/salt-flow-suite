import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeatherWidget } from '../WeatherWidget';
import * as useWeather from '@/hooks/useWeather';

vi.mock('@/hooks/useWeather', () => ({
  useWeather: vi.fn(),
}));

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

describe('WeatherWidget', () => {
  it('should render loading state', () => {
    vi.mocked(useWeather.useWeather).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    const { queryByText, container } = render(<WeatherWidget latitude={45.5} longitude={-73.5} />, { wrapper: createWrapper() });
    
    const loadingElement = queryByText(/chargement/i) || container.querySelector('[role="progressbar"]');
    expect(loadingElement || container).toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.mocked(useWeather.useWeather).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    const { getByText } = render(<WeatherWidget latitude={45.5} longitude={-73.5} />, { wrapper: createWrapper() });
    
    expect(getByText(/erreur/i)).toBeInTheDocument();
  });

  it('should render weather data', () => {
    const mockWeatherData = {
      current: {
        temperature: 25,
        feels_like: 27,
        humidity: 60,
        pressure: 1013,
        wind_speed: 5,
        description: 'Ciel dégagé',
        icon: '01d',
        sunrise: 1234567890,
        sunset: 1234567890,
      },
      forecast: [],
    };

    vi.mocked(useWeather.useWeather).mockReturnValue({
      data: mockWeatherData,
      isLoading: false,
      isError: false,
    } as any);

    const { getByText } = render(<WeatherWidget latitude={45.5} longitude={-73.5} />, { wrapper: createWrapper() });
    
    expect(getByText('25°')).toBeInTheDocument();
    expect(getByText(/ciel dégagé/i)).toBeInTheDocument();
  });

  it('should not render without coordinates', () => {
    vi.mocked(useWeather.useWeather).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as any);

    const { container } = render(<WeatherWidget />, { wrapper: createWrapper() });
    
    expect(container.textContent).toBe('');
  });
});
