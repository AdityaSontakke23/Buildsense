import { useEffect, useCallback } from 'react';
import { useProjectsStore } from '@/src/store/projectsStore';
import { useAuthStore } from '@/src/store/authStore';
import * as projectsService from '@/src/services/projectsService';
import { parseSupabaseError } from '@/src/utils/errorHandler';

export const useProjects = () => {
  const { projects, activeProject, isLoading, error, setProjects, addProject,
    removeProject, setActiveProject, setLoading, setError } = useProjectsStore();
  const { user } = useAuthStore();

  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await projectsService.getProjects(user.id);
    if (error) setError(parseSupabaseError(error));
    else setProjects(data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProject = async (projectData) => {
    const payload = { ...projectData, user_id: user.id };
    // optimistic UI — add immediately
    const tempId = `temp_${Date.now()}`;
    addProject({ ...payload, id: tempId });
    const { data, error } = await projectsService.createProject(payload);
    if (error) {
      removeProject(tempId);
      setError(parseSupabaseError(error));
      return { data: null, error };
    }
    removeProject(tempId);
    addProject(data);
    return { data, error: null };
  };

  const deleteProject = async (id) => {
    removeProject(id); // optimistic UI
    const { error } = await projectsService.deleteProject(id);
    if (error) {
      setError(parseSupabaseError(error));
      refreshProjects(); // revert on failure
    }
    return { error };
  };

  return { projects, activeProject, isLoading, error,
    createProject, deleteProject, setActiveProject, refreshProjects };
};