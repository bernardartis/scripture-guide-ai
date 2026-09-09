import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sitratec.emmaus',
  appName: 'Emmaus',
  webDir: 'out',
  server: {
    url: 'https://scripture-guide-ai.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#F8F7F4',
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      style: 'Default',
      backgroundColor: '#2E3A59',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
