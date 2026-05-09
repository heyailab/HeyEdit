import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";
import type { AppConfig, LayoutType } from "@/lib/types";

const STORE_PATH = "config.json";

const DEFAULT_CONFIG: AppConfig = {
  language: "en",
  theme: "system",
  layout: "sidebar",
  autostart: false,
  close_to_tray: true,
  update_endpoint: "https://heyedit.heyailab.com",
};

interface ConfigState {
  config: AppConfig;
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<AppConfig>) => Promise<void>;
  setTheme: (theme: AppConfig["theme"]) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setLayout: (layout: LayoutType) => Promise<void>;
}

let store: LazyStore | null = null;

function getStore(): LazyStore {
  if (!store) {
    store = new LazyStore(STORE_PATH);
  }
  return store;
}

export const useConfigStore = create<ConfigState>()((set, get) => ({
  config: DEFAULT_CONFIG,
  loaded: false,

  load: async () => {
    try {
      const s = getStore();
      const saved = await s.get<AppConfig>("config");
      if (saved) {
        set({ config: { ...DEFAULT_CONFIG, ...saved }, loaded: true });
      } else {
        await s.set("config", DEFAULT_CONFIG);
        await s.save();
        set({ loaded: true });
      }
    } catch (e) {
      console.error("Failed to load config:", e);
      set({ loaded: true });
    }
  },

  update: async (partial) => {
    const newConfig = { ...get().config, ...partial };
    set({ config: newConfig });
    try {
      const s = getStore();
      await s.set("config", newConfig);
      await s.save();
    } catch (e) {
      console.error("Failed to save config:", e);
    }
  },

  setTheme: async (theme) => {
    await get().update({ theme });
  },

  setLanguage: async (language) => {
    await get().update({ language });
  },

  setLayout: async (layout) => {
    await get().update({ layout });
  },
}));
