import { useEffect, useCallback } from 'react';
import { useProjectsStore } from '@/src/store/projectsStore';
import { useAuthStore } from '@/src/store/authStore';
import * as projectsService from '@/src/services/projectsService';
import { parseSupabaseError } from '@/src/utils/errorHandler';

// Supabase snake_case → app camelCase
const mapProject = (p) => ({
  id:                 p.id,
  user_id:            p.user_id,
  name:               p.name,
  city:               p.city,
  lat:                p.lat,
  lon:                p.lon,
  area:               p.area,
  floors:             p.floors,
  orientation:        p.orientation,
  wallType:           p.wall_type,
  roofType:           p.roof_type,
  wwr:                p.wwr,
  passiveStrategies:  Array.isArray(p.passive_strategies) ? p.passive_strategies : [],
  weather:            p.weather ?? null,   // jsonb → already a JS object
  score:              p.score,
  created_at:         p.created_at,
  updated_at:         p.updated_at,
});

export const useProjects = () => {
  const { projects, activeProject, isLoading, error, setProjects, addProject,
    removeProject, setActiveProject, setLoading, setError } = useProjectsStore();
  const { user } = useAuthStore();

  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await projectsService.getProjects(user.id);
    if (error) setError(parseSupabaseError(error));
    else setProjects((data ?? []).map(mapProject));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProject = async (projectData) => {
    const payload = { ...projectData, user_id: user.id };
    const tempId = `temp_${Date.now()}`;
    addProject({ ...payload, id: tempId });

    const { data, error } = await projectsService.createProject(payload);
    if (error) {
      removeProject(tempId);
      setError(parseSupabaseError(error));
      return { data: null, error };
    }
    removeProject(tempId);
    const mapped = mapProject(data);
    addProject(mapped);
    return { data: mapped, error: null };
  };

  const deleteProject = async (id) => {
    removeProject(id);
    const { error } = await projectsService.deleteProject(id);
    if (error) {
      setError(parseSupabaseError(error));
      refreshProjects();
    }
    return { error };
  };

  return { projects, activeProject, isLoading, error,
    createProject, deleteProject, setActiveProject, refreshProjects };
};