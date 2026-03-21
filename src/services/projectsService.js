import { supabase } from './supabase';
import { logError } from '@/src/utils/errorHandler';

export const createProject = async (projectData) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id, name, city, score, created_at')
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
      .select('id, name, city, score, created_at')
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