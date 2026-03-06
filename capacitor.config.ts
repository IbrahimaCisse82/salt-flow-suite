import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a879894c887f41e89be4ab73e08c3d84',
  appName: 'g-suitesel',
  webDir: 'dist',
  server: {
    url: 'https://a879894c-887f-41e8-9be4-ab73e08c3d84.lovableproject.com?forceHideBadge=true',
    cleartext: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
