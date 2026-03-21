import { supabase } from './supabase';
import { logError } from '@/src/utils/errorHandler';

export const createProject = async (projectData) => {
  try {
    const payload = {
      user_id:            projectData.user_id ?? projectData.userId,
      name:               projectData.name,
      city:               projectData.city,
      lat:                projectData.lat ?? null,
      lon:                projectData.lon ?? null,
      area:               projectData.area ? parseFloat(projectData.area) : null,
      floors:             projectData.floors ? parseInt(projectData.floors) : 1,
      orientation:        projectData.orientation,
      wall_type:          projectData.wallType,
      roof_type:          projectData.roofType,
      wwr:                parseInt(projectData.wwr),
      passive_strategies: projectData.passiveStrategies ?? [],
      weather:            projectData.weather ?? null,
      score:              projectData.score ?? null,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select('*')        // ← was only selecting 5 fields
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('projectsService.createProject', error);
    return { data: null, error };
  }
};

export const getProjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')        // ← was only selecting 5 fields — THIS was the bug
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('projectsService.getProjects', error);
    return { data: null, error };
  }
};

export const getProjectById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('projectsService.getProjectById', error);
    return { data: null, error };
  }
};

export const updateProject = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logError('projectsService.updateProject', error);
    return { data: null, error };
  }
};

export const deleteProject = async (id) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    logError('projectsService.deleteProject', error);
    return { error };
  }
};