import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

interface AudioStore extends AudioSettings {
  toggleSound: () => void;
  toggleMusic: () => void;
}

// Persisted to localStorage so sound/music choices survive a refresh
export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
    }),
    {
      name: "plinko-audio-settings",
      partialize: ({ soundEnabled, musicEnabled }) => ({ soundEnabled, musicEnabled }),
    }
  )
);
