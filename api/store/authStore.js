// store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false 
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      },

      updateUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },

      setLoading: (isLoading) => set({ isLoading }),

      // Getters
      getUser: () => get().user,
      getToken: () => get().token,
      isAuth: () => get().isAuthenticated,
    }),
    {
      name: 'auth-storage', // tên key trong localStorage
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;