# Guide de Build Desktop

Ce guide explique comment créer les applications de bureau pour Windows et macOS.

## Prérequis

### Pour tous les systèmes
- Node.js 18+ installé
- Dépendances npm installées (`npm install`)

### Pour macOS
- macOS 10.13+ (pour builder)
- Xcode Command Line Tools
- Un Mac est REQUIS pour créer des builds macOS

### Pour Windows
- Windows 7+ ou Linux/macOS avec Wine
- Sur Linux: `sudo apt-get install wine64`

## Scripts disponibles

```json
{
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
  "electron:build": "npm run build && electron-builder",
  "electron:build:mac": "npm run build && electron-builder --mac",
  "electron:build:win": "npm run build && electron-builder --win",
  "electron:build:linux": "npm run build && electron-builder --linux",
  "electron:build:all": "npm run build && electron-builder -mwl"
}
```

## Développement

Pour tester l'application Electron en mode développement :

```bash
npm run electron:dev
```

Cela lance Vite en mode dev et ouvre la fenêtre Electron.

## Build de production

### Build pour macOS (DMG + ZIP)

```bash
npm run electron:build:mac
```

Fichiers générés dans `dist-electron/` :
- `G-Suite Sel-1.0.0-arm64.dmg` (Apple Silicon)
- `G-Suite Sel-1.0.0-x64.dmg` (Intel)
- `G-Suite Sel-1.0.0-arm64-mac.zip`
- `G-Suite Sel-1.0.0-mac.zip`

### Build pour Windows (Installateur NSIS + Portable)

```bash
npm run electron:build:win
```

Fichiers générés dans `dist-electron/` :
- `G-Suite Sel Setup 1.0.0.exe` (Installateur x64)
- `G-Suite Sel Setup 1.0.0-ia32.exe` (Installateur 32-bit)
- `G-Suite Sel 1.0.0.exe` (Version portable)

### Build pour Linux

```bash
npm run electron:build:linux
```

Fichiers générés dans `dist-electron/` :
- `G-Suite Sel-1.0.0.AppImage`
- `g-suite-sel_1.0.0_amd64.deb`

### Build pour toutes les plateformes

```bash
npm run electron:build:all
```

⚠️ **Attention** : Pour créer des builds macOS, vous DEVEZ être sur un Mac.

## Configuration

### Personnalisation de l'icône

L'icône de l'application est définie dans `electron-builder.json` :
- Remplacez `public/salt-logo.png` par votre icône (512x512px minimum recommandé)
- Pour macOS : peut utiliser `.icns`
- Pour Windows : peut utiliser `.ico`

### Signature de code (production)

#### macOS
1. Obtenir un certificat Apple Developer
2. Ajouter dans `electron-builder.json` :
```json
"mac": {
  "identity": "Developer ID Application: Votre Nom (TEAM_ID)"
}
```

#### Windows
1. Obtenir un certificat de signature de code
2. Ajouter dans `electron-builder.json` :
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

## Distribution

### Hébergement des installateurs

Les fichiers générés dans `dist-electron/` peuvent être :
- Hébergés sur votre propre serveur
- Distribués via GitHub Releases
- Mis sur un CDN

### Auto-updates (optionnel)

Pour activer les mises à jour automatiques, configurez `electron-updater` :

1. Installer : `npm install electron-updater`
2. Configurer dans `electron/main.js`
3. Définir `publish` dans `electron-builder.json`

## Dépannage

### Erreur "Application is damaged" sur macOS
- L'application n'est pas signée
- Solution temporaire : `xattr -cr /Applications/G-Suite\ Sel.app`
- Solution permanente : Signer avec un certificat Apple Developer

### Erreur "Windows SmartScreen" sur Windows
- L'application n'est pas signée
- Les utilisateurs peuvent cliquer sur "More info" → "Run anyway"
- Solution permanente : Signer avec un certificat de signature de code

### Build échoue sur macOS
- Vérifier que Xcode Command Line Tools est installé : `xcode-select --install`
- Vérifier les permissions : `sudo chown -R $USER /usr/local`

## Structure des fichiers

```
project/
├── electron/
│   ├── main.js           # Process principal Electron
│   └── preload.js        # Script preload sécurisé
├── build/
│   └── entitlements.mac.plist  # Permissions macOS
├── electron-builder.json # Configuration builder
└── dist-electron/        # Fichiers de sortie (généré)
```

## Ressources

- [Documentation Electron](https://www.electronjs.org/docs)
- [Documentation electron-builder](https://www.electron.build/)
- [Guide de signature macOS](https://www.electron.build/code-signing)
- [Guide de signature Windows](https://www.electron.build/code-signing#windows)
