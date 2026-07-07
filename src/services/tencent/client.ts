/**
 * Tencent CloudBase client — lazy-initialized singleton.
 *
 * Layer: Storage Layer (⬛)
 *
 * Uses @cloudbase/js-sdk for browser-side access.
 * The import is dynamic to avoid SSR bundling of Node.js modules.
 *
 * Required CloudBase console settings:
 *   1. Enable Anonymous Login (Auth → Login Methods)
 *   2. Add deployment domain to Security Domains
 *   3. Set NEXT_PUBLIC_TENCENT_CLOUDBASE_ACCESS_KEY (Publishable Key)
 *
 * Only used when NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER === "tencent".
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null;
let initAttempted = false;
/** Promise that resolves when auth bootstrap (anonymous sign-in) is complete. */
let authReadyPromise: Promise<void> | null = null;

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
    const accessKey = process.env.NEXT_PUBLIC_TENCENT_CLOUDBASE_ACCESS_KEY;

    app = cloudbase.init({
      env: envId,
      ...(accessKey ? { accessKey } : {}),
    });

    if (!accessKey) {
      console.warn(
        "[Tencent CloudBase] No accessKey configured. " +
        "Set NEXT_PUBLIC_TENCENT_CLOUDBASE_ACCESS_KEY in EdgeOne env vars. " +
        "Get it from: CloudBase console → Environment Settings → API Keys → Publishable Key"
      );
    }

    // Bootstrap anonymous auth so database/storage calls have credentials.
    // Auth promise is stored so getTencentDatabase() / tencentAudioRepository
    // can await it before making API calls.
    authReadyPromise = (async () => {
      try {
        const auth = app.auth({ persistence: "local" });
        const loginState = await auth.getLoginState();
        if (!loginState) {
          await auth.signInAnonymously();
          console.log("[Tencent CloudBase] Signed in anonymously.");
        } else {
          console.log("[Tencent CloudBase] Already signed in.");
        }
      } catch (authErr) {
        console.error(
          "[Tencent CloudBase] Auth bootstrap failed. " +
          "Ensure CloudBase console has: " +
          "(1) Anonymous Login enabled in Auth → Login Methods, " +
          "(2) Deployment domain added to Security Domains, " +
          "(3) NEXT_PUBLIC_TENCENT_CLOUDBASE_ACCESS_KEY set to Publishable Key.",
          authErr
        );
        throw new Error(
          "CloudBase authentication failed. Enable Anonymous Login in CloudBase console, " +
          "add the deployment domain to Security Domains, and set " +
          "NEXT_PUBLIC_TENCENT_CLOUDBASE_ACCESS_KEY if required."
        );
      }
    })();

    await authReadyPromise;
  } catch (err) {
    console.error("[Tencent CloudBase] Init failed:", err);
    app = null;
  }
  return app;
}

/** Wait for auth bootstrap to complete. Call before any database/storage operation. */
export async function waitForTencentAuth(): Promise<void> {
  if (authReadyPromise) await authReadyPromise;
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

  // Ensure auth is ready before returning the database handle
  await waitForTencentAuth();

  dbInstance = tcb.database();
  return dbInstance;
}

export async function isTencentConfigured(): Promise<boolean> {
  const tcb = await getTencentApp();
  return tcb !== null;
}
