# Guide de Déploiement - G-Suite Sel

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase configuré
- Compte Netlify/Vercel (optionnel pour déploiement automatique)

## 🚀 Déploiement rapide via Lovable

### Option 1 : Déploiement automatique
1. Cliquez sur le bouton **"Publish"** en haut à droite de l'éditeur Lovable
2. Suivez les instructions pour déployer sur Lovable Cloud
3. L'application sera accessible sur `[votre-projet].lovableproject.com`

### Option 2 : Déploiement sur votre propre hébergement
1. Cliquez sur le bouton **GitHub** pour exporter le code
2. Choisissez votre plateforme de déploiement (Netlify, Vercel, etc.)

---

## 🔧 Configuration de production

### 1. Variables d'environnement

Les secrets Supabase sont déjà configurés dans votre projet :
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

**Important** : Ces valeurs sont déjà dans le code (`src/integrations/supabase/client.ts`) et ne nécessitent pas de fichier `.env`

### 2. Configuration Supabase

#### URLs de redirection
Dans le [dashboard Supabase](https://supabase.com/dashboard/project/mwxybozfksdxrsipywlh/auth/url-configuration) :

**Site URL** (Production) :
```
https://g-suiteapp.com
```

**Redirect URLs** (Ajouter toutes ces URLs) :
```
https://g-suiteapp.com/**
https://g-suiteapp.com/auth
https://[votre-domaine].lovableproject.com/**
https://[votre-domaine].netlify.app/**
```

#### Authentification par email
1. Allez dans [Email Templates](https://supabase.com/dashboard/project/mwxybozfksdxrsipywlh/auth/templates)
2. Vérifiez que les templates incluent `{{ .ConfirmationURL }}` ou `{{ .Token }}`

---

## 📱 PWA - Application Mobile

### Installation utilisateur
L'application est déjà configurée comme PWA. Les utilisateurs peuvent :

**Sur iPhone/iPad** :
1. Ouvrir Safari sur `https://g-suiteapp.com`
2. Appuyer sur le bouton Partager (carré avec flèche)
3. Sélectionner "Sur l'écran d'accueil"

**Sur Android** :
1. Ouvrir Chrome sur `https://g-suiteapp.com`
2. Appuyer sur le menu (⋮)
3. Sélectionner "Installer l'application"

### Page d'installation dédiée
Accédez à `/install` pour voir les instructions d'installation détaillées

---

## 🏗️ Build manuel

Si vous souhaitez builder localement :

```bash
# 1. Cloner depuis GitHub
git clone [votre-repo]
cd g-suite-sel

# 2. Installer les dépendances
npm install

# 3. Builder pour la production
npm run build

# 4. Prévisualiser le build
npm run preview
```

Le dossier `dist/` contiendra l'application prête à être déployée.

---

## 🌐 Configuration DNS (pour domaine personnalisé)

### Netlify
1. Allez dans **Domain settings**
2. Ajoutez votre domaine `g-suiteapp.com`
3. Configurez les DNS chez votre registrar :
   ```
   A record: 75.2.60.5
   CNAME: [votre-site].netlify.app
   ```

### Vercel
1. Allez dans **Settings > Domains**
2. Ajoutez `g-suiteapp.com`
3. Suivez les instructions DNS fournies

---

## 🔒 Sécurité en Production

### Headers de sécurité (déjà configurés)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`

### RLS Supabase (déjà configuré)
- ✅ Row Level Security activé sur toutes les tables
- ✅ Politiques d'accès par rôle et tenant
- ✅ Isolation complète des données entre tenants

### Recommandations supplémentaires
1. **Activer HTTPS** : Obligatoire (automatique sur Netlify/Vercel)
2. **Firewall WAF** : Configurer si disponible sur votre plateforme
3. **Rate limiting** : Activer sur Supabase (API Settings)

---

## 📊 Monitoring et Performance

### Analytics
- Intégrez Google Analytics ou Plausible si nécessaire
- Supabase fournit des analytics de base dans le dashboard

### Logs
- **Edge Functions** : Visibles dans [Supabase Dashboard](https://supabase.com/dashboard/project/mwxybozfksdxrsipywlh/functions)
- **Database** : Logs Postgres disponibles dans l'onglet Database

### Performance
- ✅ Code splitting configuré
- ✅ Compression des assets
- ✅ Cache optimisé pour PWA
- ✅ Images lazy-loading

---

## 🧪 Tests avant mise en production

### Checklist de vérification

- [ ] Tester l'inscription d'un nouveau compte
- [ ] Vérifier que chaque tenant voit uniquement ses données
- [ ] Tester tous les rôles (admin, gerant, commercial, comptable, production)
- [ ] Vérifier le fonctionnement offline (PWA)
- [ ] Tester sur mobile (iOS et Android)
- [ ] Vérifier les redirections après login
- [ ] Tester la réinitialisation de mot de passe
- [ ] Vérifier les notifications comptables

### Tests multi-tenants
```bash
# Créer 2 comptes entreprises différentes
# Vérifier que :
# - Les données ne se mélangent pas
# - Chaque utilisateur voit uniquement son entreprise
# - Les invitations fonctionnent correctement
```

---

## 🆘 Support et Dépannage

### Erreurs courantes

**"An error occurred" après connexion mobile**
- ✅ Résolu : Attente du chargement du profile avant les queries

**Données visibles entre tenants**
- ✅ Résolu : RLS et tenant_id ajoutés sur tous les hooks

**Chunk loading error**
- ✅ Résolu : ErrorBoundary reload automatique

### Logs de débogage
Les logs sont désactivés en production. Pour déboguer :
1. Modifier `vite.config.ts` : `drop_console: false`
2. Rebuilder
3. Vérifier les logs dans la console navigateur

---

## 📞 Contact Support

**Email technique** : support@g-suiteapp.com  
**Documentation Supabase** : https://supabase.com/docs  
**Lovable Support** : https://docs.lovable.dev

---

## 🎉 Post-Déploiement

### Première connexion administrateur
1. Créer un compte via `/auth` avec le rôle "gerant"
2. Créer votre entreprise (tenant)
3. Inviter des utilisateurs avec les rôles appropriés

### Configuration initiale recommandée
1. Créer le plan comptable dans `/admin/chart-of-accounts`
2. Définir les types de dépenses dans `/admin/expense-types`
3. Créer les bassins dans `/bassins`
4. Créer la première campagne dans `/campagne`
5. Ajouter les employés et équipes dans `/equipes`

---

**Version** : 1.0.0  
**Dernière mise à jour** : Octobre 2025
