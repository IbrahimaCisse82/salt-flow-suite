# Configuration Desktop - Étapes finales

## Modifications manuelles requises dans package.json

Ajoutez les scripts suivants dans la section `"scripts"` de votre `package.json` :

```json
"scripts": {
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
  "electron:build": "npm run build && electron-builder",
  "electron:build:mac": "npm run build && electron-builder --mac",
  "electron:build:win": "npm run build && electron-builder --win",
  "electron:build:linux": "npm run build && electron-builder --linux",
  "electron:build:all": "npm run build && electron-builder -mwl"
}
```

Ajoutez également la propriété `"main"` à la racine du fichier :

```json
{
  "name": "g-suite-sel",
  "main": "electron/main.js",
  ...
}
```

## Commandes disponibles après configuration

- **Développement** : `npm run electron:dev`
- **Build macOS** : `npm run electron:build:mac`
- **Build Windows** : `npm run electron:build:win`
- **Build Linux** : `npm run electron:build:linux`
- **Build toutes plateformes** : `npm run electron:build:all`

## Prochaines étapes

1. Ajoutez les scripts ci-dessus dans `package.json`
2. Testez en mode développement : `npm run electron:dev`
3. Créez votre premier build : `npm run electron:build:mac` (sur Mac) ou `npm run electron:build:win` (sur Windows)
4. Les fichiers installables seront dans le dossier `dist-electron/`

Pour plus de détails, consultez `DESKTOP_BUILD.md`.
