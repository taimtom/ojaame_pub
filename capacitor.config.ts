import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.ojaa.app',
  appName: 'Ojaa Me',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
