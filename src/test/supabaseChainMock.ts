import { vi } from 'vitest';

/**
 * Chainable PostgREST-like query builder mock.
 * Every builder method returns the same object, and the object is thenable,
 * so `await supabase.from('x').select().eq().is().order()` resolves to the
 * configured result regardless of the exact chain used by the hook.
 */
export type ChainResult = { data: unknown; error: unknown };

export const createQueryChain = (result: ChainResult = { data: [], error: null }) => {
  const chain: Record<string, unknown> = {};

  const methods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
    'contains', 'or', 'not', 'filter', 'match',
    'order', 'limit', 'range', 'returns', 'abortSignal',
  ];

  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }

  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.csv = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (value: ChainResult) => unknown) => Promise.resolve(result).then(resolve);

  return chain;
};

/** Full supabase client mock with a chainable `from()` and stubbed auth/functions/rpc. */
export const createSupabaseMock = (result: ChainResult = { data: [], error: null }) => ({
  from: vi.fn(() => createQueryChain(result)),
  rpc: vi.fn(() => Promise.resolve(result)),
  functions: { invoke: vi.fn(() => Promise.resolve(result)) },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
  removeChannel: vi.fn(),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
});
