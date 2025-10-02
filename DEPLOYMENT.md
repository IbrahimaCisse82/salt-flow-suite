# 🚀 Guide de Déploiement - G-Suite Sel

## 📋 Pré-requis

### ✅ Checklist Avant Déploiement

- [x] Base de données Supabase configurée et migrée
- [x] RLS (Row Level Security) activé sur toutes les tables
- [x] Toutes les politiques de sécurité appliquées
- [x] Edge Functions déployées (invite-user, delete-user, create-user)
- [x] Variables d'environnement configurées
- [x] Tests de sécurité effectués
- [x] SEO optimisé (meta tags, sitemap, manifest)
- [x] PWA configuré
- [x] Error Boundary implémenté
- [x] Lazy loading des images

## 🌐 Option 1 : Déploiement via Lovable (Recommandé)

### Étapes Rapides

1. **Cliquer sur le bouton "Publish"** en haut à droite de l'éditeur Lovable
2. Lovable déploiera automatiquement l'application sur son infrastructure
3. Votre application sera accessible sur : `https://a879894c-887f-41e8-9be4-ab73e08c3d84.lovableproject.com`

### Avantages
- ✅ Déploiement instantané (quelques minutes)
- ✅ SSL/HTTPS automatique
- ✅ CDN mondial
- ✅ Mises à jour automatiques
- ✅ Rollback facile via l'historique de versions
- ✅ Edge Functions déployées automatiquement
- ✅ CORS pré-configuré pour Lovable

### ⚠️ Configuration Post-Déploiement OBLIGATOIRE

**1. Activer la Protection des Mots de Passe Compromis**
   - Aller sur : [Supabase Auth Settings](https://supabase.com/dashboard/project/mwxybozfksdxrsipywlh/auth/providers)
   - Activer **"Leaked Password Protection"**
   - ⚠️ **CRITIQUE** : Cette étape ne peut pas être automatisée

**2. Configurer les URLs de Redirection**
   - Aller sur : [Supabase URL Configuration](https://supabase.com/dashboard/project/mwxybozfksdxrsipywlh/auth/url-configuration)
   - Ajouter dans "Redirect URLs" :
     ```
     https://a879894c-887f-41e8-9be4-ab73e08c3d84.lovableproject.com/**
     ```
   - Si vous utilisez un domaine personnalisé, ajoutez également :
     ```
     https://votredomaine.com/**
     https://www.votredomaine.com/**
     ```

**3. Tester les Fonctionnalités Critiques**
   - [ ] Inscription avec création de tenant
   - [ ] Connexion/déconnexion
   - [ ] Invitation d'utilisateurs
   - [ ] Affichage des données selon les rôles
   - [ ] Création de bassins, campagnes, production

### Configuration du Domaine Personnalisé

1. Aller dans **Project > Settings > Domains**
2. Ajouter votre domaine personnalisé (ex: `g-suitesel.com`)
3. Configurer les enregistrements DNS :
   ```
   Type: A
   Nom: @
   Valeur: 185.158.133.1
   
   Type: A
   Nom: www
   Valeur: 185.158.133.1
   ```
4. Attendre la validation SSL (quelques minutes à 48h max)
5. **IMPORTANT** : Mettre à jour `supabase/functions/_shared/cors.ts` avec votre domaine
6. Republier l'application

⚠️ **Note:** Un plan payant Lovable est requis pour les domaines personnalisés.

---

## 🐙 Option 2 : Déploiement via GitHub + Hébergeur Externe

### 1. Exporter vers GitHub

1. Cliquer sur **GitHub → Connect to GitHub** dans Lovable
2. Autoriser l'application Lovable sur GitHub
3. Créer un nouveau dépôt
4. Le code sera automatiquement synchronisé

### 2. Cloner et Installer Localement

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/votre-repo.git
cd votre-repo

# Installer les dépendances
npm install

# Build de production
npm run build
```

### 3. Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

**Variables d'environnement Vercel :**
- Aucune variable ENV n'est nécessaire côté client
- Les credentials Supabase sont déjà dans le code (clé publique)

### 4. Déploiement sur Netlify

```bash
# Installer Netlify CLI
npm i -g netlify-cli

# Déployer
netlify deploy --prod --dir=dist
```

**Configuration Netlify (`netlify.toml`) :**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 5. Autres Hébergeurs Compatibles

- **Cloudflare Pages**
- **AWS Amplify**
- **DigitalOcean App Platform**
- **Render**
- **Railway**

---

## 🗄️ Configuration Supabase Production

### Vérifications Importantes

1. **URL et Clés Supabase**
   - URL actuelle: `https://mwxybozfksdxrsipywlh.supabase.co`
   - Clé publique configurée dans `src/integrations/supabase/client.ts`

2. **Migrations Appliquées**
   ```bash
   # Vérifier que toutes les migrations sont appliquées
   # Via Supabase Dashboard > SQL Editor
   ```

3. **RLS Activé**
   - Toutes les tables ont RLS activé ✅
   - Politiques de sécurité configurées ✅

4. **Edge Functions Déployées**
   - `invite-user` - Invitation d'utilisateurs
   - `delete-user` - Suppression d'utilisateurs
   - `create-user` - Création d'utilisateurs
   
   Ces fonctions sont déployées automatiquement par Lovable.

5. **Backup Base de Données**
   ```
   Supabase Dashboard > Settings > Database > Backup
   ```
   - Configurer des backups automatiques quotidiens
   - Tester la restauration avant la mise en production

---

## 🔒 Sécurité Production

### Configuration CORS

Le CORS est déjà configuré pour Lovable dans `supabase/functions/_shared/cors.ts` :

**Domaines autorisés actuellement :**
- ✅ `http://localhost:5173` (développement)
- ✅ `https://mwxybozfksdxrsipywlh.supabase.co` (Supabase)
- ✅ `https://a879894c-887f-41e8-9be4-ab73e08c3d84.lovableproject.com` (Lovable Production)

**Quand ajouter un domaine personnalisé :**
1. Modifier `supabase/functions/_shared/cors.ts`
2. Ajouter votre domaine dans `ALLOWED_ORIGINS`
3. Republier l'application

### Checklist Sécurité Production

- [x] RLS activé sur toutes les tables
- [x] Politiques de sécurité restrictives par rôle
- [x] CORS configuré pour Lovable
- [x] Mots de passe renforcés (8 caractères, majuscule, minuscule, chiffre)
- [x] Protection PII (emails, téléphones, salaires)
- [ ] ⚠️ **À FAIRE MANUELLEMENT** : Activer "Leaked Password Protection" dans Supabase
- [ ] ⚠️ **À FAIRE** : Configurer les URLs de redirection dans Supabase Auth
- [ ] ⚠️ **SI DOMAINE PERSO** : Ajouter votre domaine au CORS et republier

### Headers de Sécurité

Lovable gère automatiquement les headers de sécurité :
- ✅ SSL/TLS automatique
- ✅ HTTPS obligatoire
- ✅ Headers de sécurité standards

Si hébergement externe (Vercel/Netlify), ajouter ces headers :

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Rate Limiting

Supabase inclut du rate limiting par défaut :
- 1000 requêtes/minute pour l'API REST
- 100 requêtes/seconde pour Realtime

---

## 📊 Monitoring et Logs

### 1. Supabase Dashboard

- **Logs Base de Données:** Settings > Logs
- **Edge Functions Logs:** Functions > [nom-fonction] > Logs
- **Auth Logs:** Authentication > Logs
- **API Analytics:** Settings > API

### 2. Sentry (Optionnel)

Pour un monitoring avancé des erreurs :

```bash
npm install @sentry/react
```

### 3. Analytics

L'application est prête pour Google Analytics ou Plausible :
- Ajouter le script dans `index.html`
- Respecter le RGPD (bannière de consentement si EU)

---

## 🧪 Tests Avant Production

### Checklist de Tests

1. **Authentification**
   - [ ] Inscription nouveau compte + création tenant
   - [ ] Connexion avec compte existant
   - [ ] Déconnexion
   - [ ] Timeout de session (30 minutes)
   - [ ] Persiste la session au refresh

2. **Gestion des Rôles & Sécurité**
   - [ ] Admin peut accéder à /admin
   - [ ] Gérant peut inviter des utilisateurs
   - [ ] Gérant NE PEUT PAS créer d'admin
   - [ ] Commercial voit uniquement ses pages autorisées (/, /commercial, /parametres)
   - [ ] Production limité à /, /bassins, /production, /stocks, /equipes, /parametres
   - [ ] Comptable voit /, /comptabilite, /parametres

3. **Protection des Données Sensibles**
   - [ ] Salaires visibles UNIQUEMENT par gérants/admins/comptables
   - [ ] Commercial NE VOIT PAS les salaires
   - [ ] Production NE VOIT PAS les salaires ni les ventes
   - [ ] Utilisateurs ne voient PAS les emails/téléphones de leurs collègues
   - [ ] Gérants voient tous les emails/téléphones de leur tenant
   - [ ] Isolation des données entre tenants (créer 2 tenants pour tester)

4. **Données & CRUD**
   - [ ] CRUD Bassins (gérants)
   - [ ] CRUD Production (gérants + production)
   - [ ] CRUD Clients (gérants + commercial)
   - [ ] CRUD Employés (gérants)
   - [ ] CRUD Équipes (gérants)
   - [ ] CRUD Campagnes (gérants)
   - [ ] CRUD Ventes (gérants + commercial)

5. **Edge Functions**
   - [ ] create-user fonctionne lors de l'inscription
   - [ ] invite-user fonctionne avec validation des rôles
   - [ ] delete-user fonctionne (gérants uniquement)
   - [ ] Les fonctions rejettent les mots de passe faibles

6. **Performance**
   - [ ] Temps de chargement < 3s
   - [ ] Images lazy loaded
   - [ ] Pas d'erreurs console
   - [ ] Pas d'erreurs dans les logs Supabase

7. **Mobile & Responsive**
   - [ ] Responsive sur mobile (test iPhone, Android)
   - [ ] Navigation fonctionne sur mobile
   - [ ] Formulaires utilisables sur mobile
   - [ ] Tableaux scrollables horizontalement

---

## 🔄 Processus de Mise à Jour

### Via Lovable (Automatique)

1. Modifier le code dans Lovable
2. Cliquer "Publish"
3. Mise à jour instantanée

### Via GitHub (Manuel)

1. Faire les modifications localement
2. Commit et push vers GitHub
3. Lovable sync automatiquement
4. Ou redéployer manuellement sur votre hébergeur

---

## 📱 Déploiement Mobile (PWA + Capacitor)

### PWA (Déjà Configuré)

L'application est installable comme PWA :
- `manifest.json` configuré
- Service Worker prêt
- Icons optimisés

### Application Native (Optionnel)

Si vous voulez créer des apps iOS/Android natives :

```bash
# Ajouter Capacitor (déjà installé)
npx cap init

# Ajouter plateformes
npx cap add ios
npx cap add android

# Build et sync
npm run build
npx cap sync

# Ouvrir dans Xcode/Android Studio
npx cap open ios
npx cap open android
```

---

## 🆘 Rollback d'Urgence

### Via Lovable

1. Cliquer sur l'icône d'historique (horloge)
2. Sélectionner une version antérieure
3. Cliquer "Restore"

### Via GitHub

```bash
# Revenir au commit précédent
git revert HEAD
git push origin main

# Ou revenir à un commit spécifique
git reset --hard <commit-hash>
git push origin main --force
```

---

## 📞 Support et Maintenance

### Contacts Techniques

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Lovable Support:** support@lovable.dev
- **Documentation:** https://docs.lovable.dev

### Maintenance Régulière

- **Backups:** Vérifier quotidiennement
- **Logs:** Surveiller les erreurs
- **Updates:** Mettre à jour les dépendances mensuellement
- **Sécurité:** Scanner les vulnérabilités avec `npm audit`

---

## 🎉 Post-Déploiement

### Checklist Finale

1. [ ] Application accessible via URL production
2. [ ] HTTPS/SSL actif
3. [ ] Tous les utilisateurs peuvent se connecter
4. [ ] Les données sont isolées par tenant
5. [ ] Backup automatique configuré
6. [ ] Monitoring actif
7. [ ] Documentation utilisateur distribuée
8. [ ] Support technique prêt

### Communication aux Utilisateurs

1. Annoncer la mise en production
2. Fournir l'URL de production
3. Partager les guides utilisateurs
4. Configurer un canal de support
5. Former les administrateurs

---

**🚀 Votre application G-Suite Sel est maintenant prête pour la production !**
