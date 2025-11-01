# 🤝 Guide de Contribution - SaltERP

Merci de votre intérêt pour contribuer à SaltERP ! Ce guide vous aidera à démarrer.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Processus de Pull Request](#processus-de-pull-request)
- [Architecture](#architecture)

## 🤝 Code de conduite

- Respectez tous les contributeurs
- Soyez constructif dans vos commentaires
- Acceptez les critiques constructives
- Focalisez-vous sur ce qui est mieux pour le projet

## 🚀 Comment contribuer

### 1. Fork & Clone

```bash
# Fork le repository sur GitHub, puis:
git clone https://github.com/votre-username/salterp.git
cd salterp
npm install
```

### 2. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

**Convention de nommage des branches:**
- `feature/` - Nouvelles fonctionnalités
- `fix/` - Corrections de bugs
- `docs/` - Documentation uniquement
- `refactor/` - Refactoring de code
- `test/` - Ajout de tests
- `perf/` - Améliorations de performance

### 3. Développer

```bash
# Lancer le serveur de développement
npm run dev

# Lancer les tests en mode watch
npm run test:watch
```

### 4. Tester

```bash
# Lancer tous les tests
npm test

# Coverage
npm run test:coverage

# Linter
npm run lint

# Type checking
npx tsc --noEmit
```

### 5. Commit

**Format des messages de commit (Conventional Commits):**

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (sans changement de code)
- `refactor`: Refactoring
- `test`: Ajout de tests
- `perf`: Amélioration de performance
- `chore`: Maintenance

**Exemples:**
```bash
feat(bassins): add surface area validation
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
test(employees): add CRUD operation tests
```

### 6. Push & Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Puis créez une Pull Request sur GitHub avec:
- Titre descriptif
- Description détaillée des changements
- Screenshots si applicable
- Liste des tests ajoutés
- Breaking changes (si applicable)

## 💻 Standards de code

### TypeScript

```typescript
// ✅ BON
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ MAUVAIS
function getUser(id: any): any {
  // ...
}
```

### React Components

```typescript
// ✅ BON - Composant fonctionnel avec types
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};

// ❌ MAUVAIS - Props non typées
export const Button = ({ label, onClick, variant }) => {
  // ...
};
```

### Hooks personnalisés

```typescript
// ✅ BON
export const useEmployees = () => {
  const { profile } = useAuth();
  
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', profile?.tenant_id],
    queryFn: async () => {
      // ...
    },
    enabled: !!profile?.tenant_id,
  });
  
  return { employees, isLoading };
};
```

### Validation

```typescript
// ✅ BON - Utiliser Zod pour la validation
import { z } from 'zod';

const employeeSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

// Utilisation
const result = employeeSchema.safeParse(data);
if (!result.success) {
  // Gérer les erreurs
}
```

### Design System

```typescript
// ✅ BON - Utiliser les tokens du design system
<div className="bg-background text-foreground">
  <h1 className="text-primary">Titre</h1>
</div>

// ❌ MAUVAIS - Couleurs en dur
<div className="bg-white text-black">
  <h1 className="text-blue-500">Titre</h1>
</div>
```

## 🧪 Tests

### Tests unitaires

```typescript
describe('useEmployees', () => {
  it('should fetch employees for authenticated user', async () => {
    // Arrange
    const mockProfile = { tenant_id: 'tenant-123' };
    vi.mocked(useAuth).mockReturnValue({ profile: mockProfile });
    
    // Act
    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });
    
    // Assert
    await waitFor(() => {
      expect(result.current.employees).toBeDefined();
    });
  });
});
```

### Tests de composants

```typescript
describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Production"
        value="1,234 kg"
        icon={TrendingUp}
      />
    );
    
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('1,234 kg')).toBeInTheDocument();
  });
});
```

### Couverture requise

- **Minimum:** 80% pour tous les nouveaux fichiers
- **Objectif:** 85%+ globalement
- **Critique:** 100% pour utils/validation, utils/sanitization

## 📝 Processus de Pull Request

### Checklist avant PR

- [ ] Code formaté (Prettier)
- [ ] Lint passé (ESLint)
- [ ] Types validés (TypeScript)
- [ ] Tests ajoutés/mis à jour
- [ ] Tests passent (85%+ coverage)
- [ ] Documentation mise à jour
- [ ] Aucun `console.log` dans le code
- [ ] Aucun `any` TypeScript
- [ ] Commit messages conventionnels

### Review Process

1. **Automated checks** - CI/CD doit passer (lint, test, build)
2. **Code review** - Au moins 1 approbation requise
3. **Testing** - Tests manuels si nécessaire
4. **Merge** - Squash & merge par défaut

### Après le merge

- Branche automatiquement supprimée
- Déploiement automatique en staging
- Tests E2E en staging
- Déploiement en production (manuel)

## 🏗️ Architecture

### Structure des dossiers

```
src/
├── components/      # Composants React réutilisables
│   ├── ui/         # Composants UI de base (shadcn)
│   ├── Dashboard/  # Composants du dashboard
│   ├── Admin/      # Composants admin
│   └── __tests__/  # Tests des composants
├── hooks/          # Hooks personnalisés
│   └── __tests__/  # Tests des hooks
├── utils/          # Fonctions utilitaires
│   └── __tests__/  # Tests des utils
├── contexts/       # Contextes React
├── pages/          # Pages de l'application
├── integrations/   # Intégrations externes (Supabase)
└── lib/           # Configuration des librairies
```

### Patterns à suivre

**1. Composition over inheritance**
```typescript
// ✅ BON
const UserCard = ({ user }: { user: User }) => (
  <Card>
    <CardHeader>
      <Avatar user={user} />
      <UserInfo user={user} />
    </CardHeader>
  </Card>
);
```

**2. Custom hooks pour la logique métier**
```typescript
// ✅ BON - Isoler la logique dans des hooks
const useEmployeeForm = (employeeId?: string) => {
  const { employee, isLoading } = useEmployee(employeeId);
  const { createEmployee, updateEmployee } = useEmployees();
  
  const onSubmit = async (data: EmployeeInput) => {
    // Logique de soumission
  };
  
  return { employee, isLoading, onSubmit };
};
```

**3. Error boundaries**
```typescript
// Toujours wrapper les composants critiques
<ErrorBoundary fallback={<ErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

## 🔒 Sécurité

- Toujours valider les inputs (client + serveur)
- Utiliser les schémas Zod
- Sanitize HTML (DOMPurify)
- Encode URLs (encodeURIComponent)
- Pas de secrets dans le code
- RLS policies pour Supabase

## 📚 Ressources

- [Documentation Lovable](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

## 💬 Questions ?

- Discord: [Lovable Community](https://discord.com/channels/1119885301872070706)
- GitHub Issues: Pour bugs et features
- GitHub Discussions: Pour questions générales

---

**Merci de contribuer à SaltERP ! 🙏**
