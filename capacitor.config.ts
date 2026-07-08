import type { CapacitorConfig } from "@capacitor/cli";

const remoteUrl =
  process.env.NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL ||
  "https://heyin-rtgvltyz.edgeone.cool";

const config: CapacitorConfig = {
  appId: "com.heyin.app",
  appName: "Heyin",
  webDir: "out-capacitor-placeholder",
  server: {
    url: remoteUrl,
    cleartext: false,
  },
};

export default config;
