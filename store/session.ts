import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthAPI, User, LoginResponse } from '@/lib/api/auth';

interface SessionState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (login: string, senha: string, action?: 'new_session' | 'invalidate_previous') => Promise<LoginResponse>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (login: string, senha: string, action?: 'new_session' | 'invalidate_previous') => {
        try {
          const response = await AuthAPI.login(login, senha, action);

          // Se houver conflito de sessão, retorna para o componente decidir
          if (response.session_conflict) {
            return response;
          }

          // Se login bem-sucedido
          if (response.success && response.token && response.user) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
            });
          }

          return response;
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();

        if (token) {
          try {
            await AuthAPI.logout(token);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }

        set({ user: null, token: null, isAuthenticated: false });
      },

      validateSession: async () => {
        const { token } = get();

        if (!token) {
          set({ user: null, isAuthenticated: false });
          return false;
        }

        try {
          const response = await AuthAPI.validateToken(token);

          if (!response.valid) {
            set({ user: null, token: null, isAuthenticated: false });
            return false;
          }

          return true;
        } catch (error) {
          console.error('Session validation error:', error);
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'lynx-session',
    }
  )
);
