// A deadline covers both response headers and the complete body (not only fetch()).
// Optional providers must never hold the SEC financial data hostage.
export async function upstream<T>(
  provider: string,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  consume: (response: Response) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { ...init, signal: controller.signal });
        console.info(JSON.stringify({ event: "company_data_upstream", provider, status: response.status, elapsedMs: Date.now() - started }));
        return await consume(response);
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error("Upstream deadline exceeded"), { code: "upstream_timeout" }));
          controller.abort();
        }, timeoutMs);
      })
    ]);
  } catch (error) {
    console.warn(JSON.stringify({ event: "company_data_upstream_failed", provider, elapsedMs: Date.now() - started, timeout: controller.signal.aborted }));
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
