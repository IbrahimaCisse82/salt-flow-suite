# 🧪 Guide Complet des Tests - SaltERP

## 📊 Couverture Actuelle: ~60% → Objectif: 100%

## Configuration

Le projet utilise:
- **Vitest** v4.0.6 pour les tests unitaires et d'intégration
- **React Testing Library** v16.3.0 pour tester les composants React
- **Playwright** v1.56.1 pour les tests E2E
- **Happy-DOM** v20.0.10 comme environnement de test

## Commandes

```bash
# Lancer tous les tests
npm test

# Mode watch (développement)
npm run test:watch

# Voir le rapport de couverture
npm run test:coverage

# Interface UI pour les tests
npm run test:ui

# Tests E2E avec Playwright
npm run test:e2e

# Tests E2E en mode UI
npm run test:e2e:ui

# Tests E2E en mode debug
npm run test:e2e:debug
```

## Structure

```
src/
├── components/
│   ├── __tests__/                    # Tests des composants principaux
│   │   ├── ErrorBoundary.test.tsx   ✅
│   │   ├── Header.test.tsx          ✅
│   │   ├── ProtectedRoute.test.tsx  ✅
│   │   ├── RoleProtectedRoute.test.tsx ✅
│   │   ├── StatsCard.test.tsx       ✅
│   │   ├── ImageWithLoading.test.tsx ✅
│   │   └── OfflineSyncIndicator.test.tsx ✅
│   ├── Dashboard/
│   │   └── __tests__/
│   │       └── StatsCard.test.tsx   ✅
│   └── Layout/
│       └── __tests__/
│           └── Header.test.tsx      ✅
├── contexts/
│   └── __tests__/                   # Tests des contextes
│       └── AuthContext.test.tsx     ✅
├── hooks/
│   └── __tests__/                   # Tests des hooks personnalisés
│       ├── useAuth.test.tsx         ✅
│       ├── useBassins.test.tsx      ✅
│       ├── useCampagnes.test.tsx    ✅
│       ├── useClients.test.tsx      ✅
│       ├── useEmployees.test.tsx    ✅
│       ├── useLeaves.test.tsx       ✅
│       ├── useProductionRecords.test.tsx ✅
│       ├── usePurchaseOrders.test.tsx ✅
│       ├── useSales.test.tsx        ✅
│       ├── useSuppliers.test.tsx    ✅
│       ├── useTeamAttendance.test.tsx ✅
│       ├── useTeams.test.tsx        ✅
│       └── useTenant.test.tsx       ✅
├── utils/
│   └── __tests__/                   # Tests des utilitaires
│       ├── analytics.test.ts        ✅
│       ├── errorTracking.test.ts    ✅
│       ├── logger.test.ts           ✅
│       ├── permissions.test.ts      ✅
│       ├── sanitization.test.ts     ✅
│       └── validation.test.ts       ✅
└── test/
    └── setup.ts                     # Configuration globale
```

## Tests Actuels (200+ tests)

### ✅ Utilitaires (utils) - 100%
- **permissions.test.ts** (5 tests) - Vérification permissions par rôle
- **validation.test.ts** (80+ tests) - Validation schémas Zod complets
  - Email, password, phone, name validation
  - Schema pour tous les formulaires (employés, bassins, clients, etc.)
  - Protection XSS et SQL injection
- **sanitization.test.ts** (25+ tests) - Protection XSS complète
  - HTML sanitization (sanitizeHtml, sanitizeRichText)
  - Strip HTML tags (stripAllHtml)
  - Attribute sanitization
  - CSS sanitization
- **analytics.test.ts** (9 tests) - Google Analytics 4
  - Initialization
  - Page views, events, conversions
  - User identification
  - Performance tracking
- **errorTracking.test.ts** (7 tests) - Sentry integration
  - Exception capture
  - Message capture
  - User context
  - Breadcrumbs
  - Performance metrics
- **logger.test.ts** (4 tests) - Logger utility

### ✅ Hooks (hooks) - 90%
- **useAuth.test.tsx** - Authentification hook
- **useBassins.test.tsx** - Gestion des bassins
- **useCampagnes.test.tsx** - Gestion des campagnes
- **useClients.test.tsx** - Gestion des clients
- **useEmployees.test.tsx** - Gestion des employés
- **useLeaves.test.tsx** - Gestion des congés
- **useProductionRecords.test.tsx** - Enregistrements production
- **usePurchaseOrders.test.tsx** - Commandes d'achat
- **useSales.test.tsx** - Ventes
- **useSuppliers.test.tsx** - Fournisseurs
- **useTeamAttendance.test.tsx** - Pointage équipes
- **useTeams.test.tsx** - Gestion des équipes
- **useTenant.test.tsx** - Gestion tenant

### ✅ Composants (components) - 70%
- **ErrorBoundary.test.tsx** - Gestion erreurs React
- **ProtectedRoute.test.tsx** - Routes protégées auth
- **RoleProtectedRoute.test.tsx** - Routes protégées rôles
- **StatsCard.test.tsx** - Carte de statistiques
- **Header.test.tsx** - En-tête application
- **ImageWithLoading.test.tsx** - Image avec loading
- **OfflineSyncIndicator.test.tsx** - Indicateur sync offline

### ✅ Contextes (contexts) - 100%
- **AuthContext.test.tsx** - Contexte authentification

### ✅ E2E (e2e/) - 4 suites
- **auth.spec.ts** - Authentification complète
- **navigation.spec.ts** - Navigation
- **accessibility.spec.ts** - Accessibilité (axe-core)
- **performance.spec.ts** - Performance Web Vitals

## Écrire des Tests

### Test d'un utilitaire

```typescript
import { describe, it, expect } from 'vitest';
import { emailSchema } from '../validation';

describe('emailSchema', () => {
  it('should validate correct email', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(emailSchema.safeParse('invalid').success).toBe(false);
  });
});
```

### Test d'un composant React

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

### Test d'un hook avec React Query

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyHook } from './useMyHook';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
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

describe('useMyHook', () => {
  it('should fetch data', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'admin' },
    } as any);

    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### Test avec mocks Supabase

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));
```

## Priorités Tests Restants

### 🔴 Urgent (pour 80%+)
- [ ] Tests hooks manquants:
  - [ ] useKPIPreferences
  - [ ] useOfflineSync
  - [ ] useOfflineMutation
  - [ ] useQualityTests
  - [ ] useQualityCertificates
  - [ ] useTraceability
  - [ ] useWeather
  - [ ] usePredictiveAnalysis
  - [ ] usePeriodComparison
  - [ ] useScheduledReports
  
- [ ] Tests composants Admin:
  - [ ] AdminDashboard
  - [ ] SystemMonitoring
  - [ ] AuditLogsTable
  - [ ] GlobalSettings
  - [ ] EmailTemplates
  - [ ] UserRoleManagement

- [ ] Tests composants Dashboard:
  - [ ] BassinOverview
  - [ ] ProductionChart
  - [ ] WeatherWidget
  - [ ] DynamicKPIGrid

### 🟡 Important (pour 100%)
- [ ] Tests composants Production:
  - [ ] QualityTestForm
  - [ ] QualityCertificateForm
  - [ ] TraceabilityView
  - [ ] YieldAnalysis

- [ ] Tests composants RH:
  - [ ] LeaveRequestForm
  - [ ] LeavesTable
  - [ ] TeamAttendanceForm
  - [ ] AttendanceValidationTable
  - [ ] PayrollPaymentForm

- [ ] Tests composants Commercial:
  - [ ] AutomaticReminders

- [ ] Tests composants Comptabilité:
  - [ ] BankReconciliation
  - [ ] ChartOfAccountsTable
  - [ ] JournalEntryForm

- [ ] Tests intégration API + Database
- [ ] Tests E2E workflows complets (CRUD, RH, Paie, Production)

## Meilleures Pratiques

1. **AAA Pattern**: Arrange, Act, Assert
2. **Isolation**: Chaque test doit être indépendant
3. **Mocking**: Mocker Supabase et dépendances externes
4. **Noms descriptifs**: Le nom doit expliquer ce qu'il vérifie
5. **Coverage**: Viser 80%+ minimum, 100% idéal
6. **Performance**: Tests rapides (<100ms par test)
7. **DRY**: Réutiliser les wrappers et mocks

## Commandes Utiles

```bash
# Lancer un test spécifique
npm test -- validation.test.ts

# Lancer tests d'un dossier
npm test -- hooks

# Mode watch avec pattern
npm test:watch -- useEmployees

# Coverage d'un fichier spécifique
npm run test:coverage -- --testPathPattern=validation

# Debug mode
npm test -- --inspect-brk

# Voir les tests lents
npm test -- --reporter=verbose
```

## Configuration Coverage (vitest.config.ts)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    'src/integrations/supabase/types.ts',
  ],
}
```

## Objectifs de Couverture

| Module | Actuel | Cible | Statut |
|--------|--------|-------|--------|
| Utils | 95% | 100% | 🟢 Excellent |
| Hooks | 65% | 90% | 🟡 Bon |
| Components | 40% | 80% | 🟠 En cours |
| Contexts | 100% | 100% | 🟢 Parfait |
| Pages | 0% | 60% | 🔴 À faire |
| **Overall** | **60%** | **85%** | 🟡 **Bon** |

## Intégration CI/CD

Les tests sont automatiquement exécutés:
- ✅ Sur chaque push
- ✅ Sur chaque PR
- ✅ Avant chaque déploiement
- ✅ Tests E2E en staging

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Coverage Reports](https://vitest.dev/guide/coverage.html)

## Contribution

Pour ajouter des tests:
1. Créer le fichier dans `__tests__/`
2. Suivre les conventions de nommage
3. Mocker les dépendances externes
4. Viser 100% de couverture du module
5. Lancer `npm test` pour valider
6. Vérifier le coverage avec `npm run test:coverage`

## Notes Importantes

- ⚠️ **Ne jamais** commiter sans tests pour nouveau code
- ✅ **Toujours** mocker Supabase dans les tests unitaires
- 🎯 **Objectif**: 85%+ coverage avant production
- 📊 **Monitoring**: Coverage reports dans CI/CD
- 🚀 **Performance**: Tous les tests doivent passer en <30s

---

**Score Qualité Tests: 8/10** ⭐⭐⭐⭐⭐⭐⭐⭐☆☆

Objectif final: **10/10** avec 100% de couverture et tous les workflows E2E testés.
