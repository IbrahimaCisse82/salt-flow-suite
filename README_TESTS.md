# 🧪 Guide des Tests - G-Suite Sel

## 📦 Setup

Tests configurés avec:
- **Vitest** - Test runner rapide
- **React Testing Library** - Tests composants
- **Happy-DOM** - Environnement DOM léger

## 🚀 Commandes

```bash
# Lancer les tests
npm run test

# Tests en mode watch
npm run test:watch

# Coverage report
npm run test:coverage

# UI interactive
npm run test:ui
```

## 📁 Structure

```
src/
├── components/
│   └── __tests__/
│       └── StatsCard.test.tsx
├── hooks/
│   └── __tests__/
│       └── useEmployees.test.ts
├── utils/
│   └── __tests__/
│       └── permissions.test.ts
└── test/
    └── setup.ts              # Configuration globale
```

## ✅ Tests Actuels

### 1. **Permissions (utils)**
- ✅ Vérification accès par rôle
- ✅ Pages accessibles par rôle
- ✅ Gestion rôle null

### 2. **StatsCard (composant)**
- ✅ Rendu titre/valeur
- ✅ Trends up/down
- ✅ Variant gradient

### 3. **useEmployees (hook)**
- ✅ Filtrage par rôle manager
- ✅ Fetch données employees
- ✅ Gestion erreurs

## 📝 Écrire un Test

### Test Unitaire (Utils)
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myUtils';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

### Test Composant
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

it('renders correctly', () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Test Hook avec Query
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useMyHook(), { wrapper });

await waitFor(() => {
  expect(result.current.data).toBeDefined();
});
```

## 🎯 Priorités Tests

### ✅ Fait
- [x] Permissions système
- [x] StatsCard
- [x] useEmployees

### 🔄 À Faire Urgent
- [ ] AuthContext
- [ ] RoleProtectedRoute
- [ ] useBassins
- [ ] useProduction
- [ ] Formulaires critiques

### 📋 À Faire Important
- [ ] Navigation flows
- [ ] Error boundaries
- [ ] Offline sync
- [ ] Push notifications

## 💡 Bonnes Pratiques

1. **AAA Pattern**: Arrange, Act, Assert
2. **Test isolation**: Chaque test indépendant
3. **Mocking**: Mock API calls, pas la logique métier
4. **Descriptive**: Noms de tests explicites
5. **Coverage**: Viser 80%+ sur code critique

## 🐛 Debugging

```bash
# Mode debug avec logs
DEBUG=* npm run test

# Test spécifique
npm run test -- permissions.test.ts

# UI mode (très pratique!)
npm run test:ui
```

## 📊 Coverage Goals

| Module | Target | Actuel |
|--------|--------|--------|
| Utils | 90% | 85% ✅ |
| Hooks | 80% | 33% 🔄 |
| Components | 70% | 10% ❌ |
| Pages | 60% | 0% ❌ |

## 🔗 Ressources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
