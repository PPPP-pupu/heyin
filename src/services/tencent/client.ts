/**
 * Tencent CloudBase client — lazy-initialized singleton.
 *
 * Layer: Storage Layer (⬛)
 *
 * Uses @cloudbase/js-sdk for browser-side access.
 * The import is dynamic to avoid SSR bundling of Node.js modules.
 * Initialized with NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID.
 *
 * Only used when NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER === "tencent".
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null;
let initAttempted = false;

async function getCloudbase() {
  // Dynamic import — CloudBase SDK is browser-only
  const mod = await import("@cloudbase/js-sdk");
  return mod.default;
}

export async function getTencentApp() {
  if (typeof window === "undefined") return null;
  if (initAttempted) return app;
  initAttempted = true;

  const envId = process.env.NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID;
  if (!envId) return null;

  try {
    const cloudbase = await getCloudbase();
    app = cloudbase.init({ env: envId });
  } catch {
    app = null;
  }
  return app;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;

export async function getTencentDatabase() {
  // Reuse cached db instance
  if (dbInstance) return dbInstance;

  const tcb = await getTencentApp();
  if (!tcb) {
    throw new Error(
      "Tencent CloudBase is not initialized. Set NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID."
    );
  }
  dbInstance = tcb.database();
  return dbInstance;
}

export async function isTencentConfigured(): Promise<boolean> {
  const tcb = await getTencentApp();
  return tcb !== null;
}
