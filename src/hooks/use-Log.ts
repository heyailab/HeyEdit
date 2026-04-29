import { useEffect } from "react";
import {
  trace,
  debug,
  info,
  warn,
  error,
  attachConsole,
} from "@tauri-apps/plugin-log";

/** Attach Rust log output to browser console. Call once at app root. */
export function useLogAttach() {
  useEffect(() => {
    const detach = attachConsole();
    return () => {
      detach.then((fn) => fn());
    };
  }, []);
}

// ── Throttle: deduplicate identical messages within 1s ──

const THROTTLE_MS = 1000;
const recentLogs = new Map<string, number>();

function shouldThrottle(key: string): boolean {
  const now = Date.now();
  const last = recentLogs.get(key);
  if (last && now - last < THROTTLE_MS) return true;
  recentLogs.set(key, now);
  if (recentLogs.size > 200) {
    const cutoff = now - THROTTLE_MS * 2;
    for (const [k, t] of recentLogs) {
      if (t < cutoff) recentLogs.delete(k);
    }
  }
  return false;
}

function serialize(args: unknown[]): string {
  try {
    return args
      .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ");
  } catch {
    return "[unserializable]";
  }
}

/**
 * Forward console.* to Rust log system. Call once at app root.
 *
 * Dev  – all levels forwarded with per-message 1 s throttle
 * Prod – only info / warn forwarded; error always forwarded
 */
export function useConsoleForward() {
  useEffect(() => {
    const originalLog = console.log;
    const originalDebug = console.debug;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    // ── Dev-only: verbose but throttled ──
    // import.meta.env.DEV is a compile-time constant → dead-code elimination
    if (import.meta.env.DEV) {
      console.log = (...args: unknown[]) => {
        originalLog(...args);
        const msg = serialize(args);
        if (!shouldThrottle(msg)) trace(msg);
      };
      console.debug = (...args: unknown[]) => {
        originalDebug(...args);
        const msg = serialize(args);
        if (!shouldThrottle(msg)) debug(msg);
      };
      console.info = (...args: unknown[]) => {
        originalInfo(...args);
        const msg = serialize(args);
        if (!shouldThrottle(msg)) info(msg);
      };
      // Dev: skip forwarding console.warn — React/TipTap/ProseMirror
      // emit many non-critical warnings that flood the terminal
      console.warn = (...args: unknown[]) => {
        originalWarn(...args);
      };
    } else {
      // ── Production: silent log/debug, throttled info/warn ──
      console.log = (...args: unknown[]) => {
        originalLog(...args);
      };
      console.debug = (...args: unknown[]) => {
        originalDebug(...args);
      };
      console.info = (...args: unknown[]) => {
        originalInfo(...args);
        const msg = serialize(args);
        if (!shouldThrottle(msg)) info(msg);
      };
      console.warn = (...args: unknown[]) => {
        originalWarn(...args);
        const msg = serialize(args);
        if (!shouldThrottle(msg)) warn(msg);
      };
    }

    // ── Always forwarded (no throttle for errors) ──
    console.error = (...args: unknown[]) => {
      originalError(...args);
      error(serialize(args));
    };

    return () => {
      console.log = originalLog;
      console.debug = originalDebug;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);
}

export { trace, debug, info, warn, error };
