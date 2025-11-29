import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  title: string;
  icon: string;
  componentKey: string;
  params?: Record<string, any>;
  canClose: boolean;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string;
  recentApps: string[];
  history: string[];
  openTab: (componentKey: string, title: string, icon: string, params?: Record<string, any>) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  closeOthers: (id: string) => void;
  addToRecent: (componentKey: string) => void;
  goBack: () => void;
}

const HOME_TAB: Tab = {
  id: 'home',
  title: 'Home',
  icon: 'Home',
  componentKey: 'home',
  canClose: false,
};

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [HOME_TAB],
      activeTabId: 'home',
      recentApps: [],
      history: ['home'],

      openTab: (componentKey, title, icon, params) => {
        const existingTab = get().tabs.find(t => t.componentKey === componentKey);

        if (existingTab) {
          set(state => ({
            activeTabId: existingTab.id,
            history: [...state.history, existingTab.id],
          }));
          return;
        }

        const newTab: Tab = {
          id: `${componentKey}-${Date.now()}`,
          title,
          icon,
          componentKey,
          params,
          canClose: true,
        };

        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
          history: [...state.history, newTab.id],
        }));

        get().addToRecent(componentKey);
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get();
        const tab = tabs.find(t => t.id === id);

        if (!tab || !tab.canClose) return;

        const newTabs = tabs.filter(t => t.id !== id);
        let newActiveId = activeTabId;

        if (activeTabId === id) {
          const closedIndex = tabs.findIndex(t => t.id === id);
          newActiveId = newTabs[Math.max(0, closedIndex - 1)].id;
        }

        set({
          tabs: newTabs,
          activeTabId: newActiveId,
        });
      },

      activateTab: (id) => {
        set(state => ({
          activeTabId: id,
          history: [...state.history, id],
        }));
      },

      closeOthers: (id) => {
        set(state => ({
          tabs: [HOME_TAB, ...state.tabs.filter(t => t.id === id && t.canClose)],
          activeTabId: id,
        }));
      },

      addToRecent: (componentKey) => {
        set(state => {
          const filtered = state.recentApps.filter(k => k !== componentKey);
          return {
            recentApps: [componentKey, ...filtered].slice(0, 6),
          };
        });
      },

      goBack: () => {
        const { history } = get();
        if (history.length > 1) {
          const newHistory = history.slice(0, -1);
          const previousId = newHistory[newHistory.length - 1];
          set({
            activeTabId: previousId,
            history: newHistory,
          });
        }
      },
    }),
    {
      name: 'lynx-tabs',
    }
  )
);
