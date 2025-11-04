# 🚀 Activation de l'Application Desktop

## Modifications manuelles requises

### 1. Éditer le fichier `package.json`

Ouvrez le fichier `package.json` et effectuez les modifications suivantes :

#### A. Ajouter la propriété "main" au début du fichier

Ajoutez cette ligne juste après `"name": "g-suite-sel"` :

```json
{
  "name": "g-suite-sel",
  "main": "electron/main.js",
  "private": true,
  ...
}
```

#### B. Ajouter les scripts Electron

Dans la section `"scripts"`, ajoutez ces lignes :

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
  "electron:build": "npm run build && electron-builder",
  "electron:build:mac": "npm run build && electron-builder --mac",
  "electron:build:win": "npm run build && electron-builder --win",
  "electron:build:linux": "npm run build && electron-builder --linux",
  "electron:build:all": "npm run build && electron-builder -mwl",
  ...autres scripts existants
}
```

### 2. Tester l'application en mode développement

Une fois les modifications effectuées, exécutez :

```bash
npm run electron:dev
```

Cela va :
- Lancer le serveur de développement Vite
- Attendre que le serveur soit prêt
- Ouvrir l'application dans une fenêtre Electron

### 3. Créer les installateurs pour distribution

#### Pour macOS (uniquement sur Mac) :
```bash
npm run electron:build:mac
```

Fichiers générés dans `dist-electron/` :
- `G-Suite Sel-1.0.0-arm64.dmg` (Apple Silicon M1/M2/M3)
- `G-Suite Sel-1.0.0-x64.dmg` (Intel)
- Fichiers `.zip` pour téléchargement direct

#### Pour Windows (sur Windows, Linux ou Mac avec Wine) :
```bash
npm run electron:build:win
```

Fichiers générés dans `dist-electron/` :
- `G-Suite Sel Setup 1.0.0.exe` (Installateur Windows 64-bit)
- `G-Suite Sel Setup 1.0.0-ia32.exe` (Installateur Windows 32-bit)
- `G-Suite Sel 1.0.0.exe` (Version portable sans installation)

#### Pour Linux :
```bash
npm run electron:build:linux
```

Fichiers générés dans `dist-electron/` :
- `G-Suite Sel-1.0.0.AppImage` (Format universel Linux)
- `g-suite-sel_1.0.0_amd64.deb` (Pour Debian/Ubuntu)

## Architecture de l'application

```
📁 Projet
├── 📁 electron/
│   ├── main.js          ← Process principal Electron
│   └── preload.js       ← Script sécurisé d'interface
├── 📁 build/
│   └── entitlements.mac.plist  ← Permissions macOS
├── electron-builder.json ← Configuration de build
├── 📁 dist/             ← Build web (généré par Vite)
└── 📁 dist-electron/    ← Installateurs (générés par electron-builder)
```

## Caractéristiques de l'application desktop

✅ **Fenêtre native** avec dimensions optimales (1400x900)
✅ **Menu application complet** en français (Fichier, Édition, Affichage, Aide)
✅ **Raccourcis clavier** (Cmd/Ctrl+R pour recharger, etc.)
✅ **Icône personnalisée** (logo sel)
✅ **Mode développement** avec DevTools
✅ **Multi-plateforme** : Windows, macOS (Intel + Apple Silicon), Linux

## Prochaines étapes

1. ✏️ Éditez `package.json` avec les modifications ci-dessus
2. 🧪 Testez avec `npm run electron:dev`
3. 📦 Créez vos installateurs avec les commandes de build
4. 🚀 Distribuez les fichiers de `dist-electron/` à vos utilisateurs

## Résolution de problèmes

### L'application ne démarre pas en mode dev
- Vérifiez que le port 8080 est libre
- Assurez-vous que toutes les dépendances sont installées (`npm install`)

### Erreur "electron: command not found"
```bash
npm install
```

### Sur macOS : "Application endommagée"
C'est normal si l'app n'est pas signée. Les utilisateurs peuvent faire :
```bash
xattr -cr "/Applications/G-Suite Sel.app"
```

### Sur Windows : Alerte SmartScreen
C'est normal si l'app n'est pas signée. Cliquer sur "Informations complémentaires" → "Exécuter quand même"

## Distribution professionnelle (optionnel)

Pour une distribution professionnelle sans alertes de sécurité :

### macOS
- Obtenir un compte Apple Developer (99$/an)
- Signer avec `codesign` et notariser avec Apple

### Windows
- Obtenir un certificat de signature de code (~300€/an)
- Configurer dans `electron-builder.json`

Pour plus de détails, consultez `DESKTOP_BUILD.md`.
