import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { OfflineSyncIndicator } from '../OfflineSyncIndicator';
import * as OfflineSyncHook from '@/hooks/useOfflineSync';

vi.mock('@/hooks/useOfflineSync', () => ({
  useOfflineSync: vi.fn(),
}));

describe('OfflineSyncIndicator', () => {
  it('should render when offline', () => {
    vi.mocked(OfflineSyncHook.useOfflineSync).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      syncNow: vi.fn(),
      isSyncing: false,
    } as any);

    const { container } = render(<OfflineSyncIndicator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should show pending changes count', () => {
    vi.mocked(OfflineSyncHook.useOfflineSync).mockReturnValue({
      isOnline: false,
      pendingCount: 5,
      syncNow: vi.fn(),
      isSyncing: false,
    } as any);

    const { getByText } = render(<OfflineSyncIndicator />);
    expect(getByText('5')).toBeInTheDocument();
  });

  it('should not render when online with no pending changes', () => {
    vi.mocked(OfflineSyncHook.useOfflineSync).mockReturnValue({
      isOnline: true,
      pendingCount: 0,
      syncNow: vi.fn(),
      isSyncing: false,
    } as any);

    const { container } = render(<OfflineSyncIndicator />);
    expect(container.firstChild).toBeNull();
  });
});
