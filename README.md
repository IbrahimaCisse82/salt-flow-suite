# 🧂 G-Suite Sel - Système de Gestion des Marais Salants

## 📖 Description

G-Suite Sel est une solution SaaS complète pour la gestion des exploitations salines. L'application permet de gérer tous les aspects d'une saline : bassins, production, stocks, équipes, campagnes, commercial et comptabilité.

## ✨ Fonctionnalités Principales

### 🏢 Multi-tenant
- Isolation complète des données par entreprise
- Gestion des rôles et permissions
- Administration centralisée

### 👥 Gestion des Rôles
- **Admin** : Administration système complète
- **Gérant** : Gestion complète de l'exploitation
- **Commercial** : Gestion des ventes et clients
- **Comptable** : Comptabilité et finances
- **Production** : Gestion de la production

### 🌊 Modules Fonctionnels

#### Bassins
- Création et suivi des bassins
- Géolocalisation sur carte
- Statut et état de production

#### Production
- Enregistrement de la production quotidienne
- Suivi par type de sel
- Indicateurs de qualité

#### Stocks
- Gestion des stocks par type
- Mouvements d'entrée/sortie
- Alertes de stock bas

#### Équipes
- Gestion des employés permanents
- Travailleurs journaliers
- Organisation en équipes
- Suivi des performances

#### Campagnes
- Planification annuelle
- Budgets par phase
- Suivi des objectifs
- Analyse de performance

#### Commercial
- Gestion des clients
- Commandes et factures
- Livraisons
- Suivi des paiements

#### Comptabilité
- Plan comptable SYSCOHADA
- Écritures comptables
- Rapports financiers
- Transactions par campagne

## 🛠️ Technologies

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - Composants UI
- **React Query** - Gestion d'état serveur
- **React Router** - Routing
- **Zod** - Validation de formulaires

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Edge Functions
  - Authentication
  - Real-time subscriptions

### Sécurité
- Authentification JWT
- Row Level Security (RLS)
- Isolation multi-tenant
- Validation côté client et serveur
- HTTPS/SSL

## 🚀 Installation et Développement

### Pré-requis
- Node.js 18+
- npm ou bun
- Compte Supabase (ou utiliser le projet existant)

### Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd g-suite-sel

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Configuration Supabase

Le projet est déjà configuré avec une instance Supabase :
- URL: `https://mwxybozfksdxrsipywlh.supabase.co`
- Les migrations sont dans `/supabase/migrations`

Pour utiliser votre propre instance :
1. Créer un projet Supabase
2. Mettre à jour les credentials dans `src/integrations/supabase/client.ts`
3. Exécuter les migrations depuis le dossier `supabase/migrations`

## 📦 Scripts Disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview du build
npm run preview

# Linter
npm run lint
```

## 🏗️ Architecture

### Structure du Projet

```
src/
├── assets/          # Images, logos
├── components/      # Composants React
│   ├── ui/         # Composants UI de base (shadcn)
│   ├── Layout/     # Header, Sidebar
│   ├── Dashboard/  # Composants du dashboard
│   └── ...
├── contexts/       # Contextes React (Auth, Sidebar)
├── hooks/          # Hooks personnalisés
├── integrations/   # Intégrations externes (Supabase)
├── pages/          # Pages de l'application
├── utils/          # Utilitaires (logger, validation)
└── lib/            # Bibliothèques (utils Tailwind)

supabase/
├── functions/      # Edge Functions
└── migrations/     # Migrations SQL
```

### Hooks Personnalisés

- `useEmployees` - Gestion des employés avec RLS
- `useDailyWorkers` - Travailleurs journaliers
- `useClients` - Gestion des clients
- `useSales` - Commandes et ventes
- `useTeams` - Équipes de travail
- `useCampagnes` - Campagnes annuelles
- `useCampagneBudgets` - Budgets de campagnes

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables Supabase utilisent RLS :
- Isolation stricte par tenant
- Politiques basées sur les rôles
- Accès en lecture/écriture contrôlé

### Exemple de Politique RLS

```sql
-- Les utilisateurs ne voient que les données de leur tenant
CREATE POLICY "Users can view data in their tenant"
ON public.bassins FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));
```

### Validation des Données

Validation avec Zod avant soumission :
```typescript
const saleSchema = z.object({
  clientId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive()
});
```

## 📱 PWA et Mobile

### Progressive Web App
- Installable sur mobile et desktop
- Fonctionne hors ligne (cache)
- Notifications push (à venir)
- Manifest et service worker configurés

### Application Native (Capacitor)
Le projet inclut Capacitor pour créer des apps natives iOS/Android :

```bash
npx cap add ios
npx cap add android
npm run build
npx cap sync
```

## 🌐 Déploiement

Voir le fichier [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes.

### Déploiement Rapide (Lovable)

1. Cliquer sur "Publish" dans Lovable
2. L'application est déployée instantanément
3. URL fournie : `*.lovable.app`

### Autres Options
- Vercel
- Netlify
- Cloudflare Pages
- AWS Amplify

## 📊 Supabase - Tables Principales

### Tables Métier
- `tenants` - Entreprises/organisations
- `profiles` - Profils utilisateurs
- `user_roles` - Rôles des utilisateurs
- `bassins` - Bassins de production
- `production_records` - Production quotidienne
- `employees` - Employés permanents
- `daily_workers` - Travailleurs journaliers
- `teams` - Équipes de travail
- `team_members` - Membres des équipes
- `clients` - Clients
- `sales` - Ventes/commandes
- `campagnes` - Campagnes annuelles
- `campagne_phase_budgets` - Budgets par phase
- `chart_of_accounts` - Plan comptable
- `transactions` - Transactions comptables
- `journal_entries` - Écritures comptables

### Edge Functions
- `invite-user` - Invitation d'utilisateurs
- `delete-user` - Suppression d'utilisateurs
- `create-user` - Création d'utilisateurs

## 🤝 Contribution

Ce projet est actuellement maintenu par l'équipe G-Suite TPE.

## 📄 Licence

Propriétaire - © 2025 Grow Hub Sarl

## 📞 Support

- Email : support@g-suiteapp.com
- Documentation : [docs.g-suiteapp.com](https://docs.g-suiteapp.com)

---

**Développé avec ❤️ par Grow Hub Sarl**
