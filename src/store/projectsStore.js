import { create } from 'zustand';

export const useProjectsStore = create((set) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  setActiveProject: (activeProject) => set({ activeProject }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));