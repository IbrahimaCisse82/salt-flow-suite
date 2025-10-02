# Déploiement

Ce document explique plusieurs façons de déployer cette application Vite + React.

Pré-requis
- Node.js 18+ (ou 20), npm
- Compte sur Netlify, Vercel, Supabase ou accès Docker

1) Netlify (recommandé pour sites statiques)
- Créer un site depuis Git et sélectionner ce dépôt.
- Commande de build : `npm run build`
- Dossier de publication : `dist`
- Fichier de config : `netlify.toml` (fourni)

2) Vercel
- Importer le projet depuis Git.
- Framework preset : Other / Static
- Commande de build : `npm run build`
- Dossier de sortie : `dist`
- Fichier `vercel.json` inclus pour routes SPA.

3) Supabase Static
- Dans Supabase Studio > Static Sites, créer un site.
- Commande de build : `npm run build`
- Dossier de sortie : `dist`

4) Docker (container)
- Construire l'image : `docker build -t salt-flow-suite .`
- Exécuter : `docker run -p 8080:80 salt-flow-suite`

Validation locale
- Installer dépendances : `npm ci`
- Build : `npm run build`
- Servir localement pour test : `npx serve dist` ou `npm run preview`

Remarques et recommandations
- Le build génère un gros chunk (MapPicker). Pour réduire la taille, envisager le code-splitting dynamique.
- Ajouter CI (GitHub Actions) si vous voulez déploiement automatique.

### Déploiement automatique sur Netlify (via GitHub Actions)

1. Créez un site Netlify et récupérez l'ID du site (Site settings → Site information → Site ID).
2. Dans votre compte Netlify, créez un Personal Access Token (User settings → Applications → Personal access tokens).
3. Dans votre dépôt GitHub, allez dans Settings → Secrets and variables → Actions → New repository secret et ajoutez :
	- `NETLIFY_AUTH_TOKEN` = (votre token)
	- `NETLIFY_SITE_ID` = (l'ID du site)
4. Le workflow GitHub Actions `.github/workflows/deploy-netlify.yml` lancé sur push vers `main` construira et déployera automatiquement.

### Déploiement manuel via Netlify CLI

1. Installer Netlify CLI localement : `npm i -g netlify-cli`
2. Se connecter : `netlify login`
3. Déployer en production :

```bash
npm ci
npm run build
netlify deploy --prod --dir=dist
```

