import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['salt-logo.png', 'robots.txt'],
      manifest: {
        name: 'G-Suite Sel - Gestion des Marais Salants',
        short_name: 'G-Suite Sel',
        description: 'Solution SaaS complète pour la gestion des exploitations salines',
        theme_color: '#0EA5E9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/salt-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Ne pas mettre en cache les pages d'authentification
        navigateFallbackDenylist: [/^\/auth/],
        runtimeCaching: [
          {
            // Exclure les endpoints d'authentification du cache
            urlPattern: /^https:\/\/mwxybozfksdxrsipywlh\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Autres endpoints Supabase avec NetworkFirst
            urlPattern: /^https:\/\/mwxybozfksdxrsipywlh\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour (réduit pour mobile)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
}));
