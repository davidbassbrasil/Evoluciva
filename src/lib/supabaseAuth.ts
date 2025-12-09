import supabase from './supabaseClient';
import {
  getUserByEmail,
  addUser,
  setCurrentUser,
  getCurrentUser,
  logout as localLogout,
} from './localStorage';
import type { User as AppUser } from '@/types';

function mapSupabaseUserToAppUser(supUser: any): AppUser {
  return {
    id: supUser.id,
    name: (supUser.user_metadata && supUser.user_metadata.name) || supUser.email || '',
    email: supUser.email || '',
    password: '',
    avatar: (supUser.user_metadata && supUser.user_metadata.avatar) || '',
    purchasedCourses: [],
    progress: {},
    createdAt: new Date().toISOString(),
  };
}

export async function signUp(name: string, email: string, password: string) {
  // If supabase client is configured use it, otherwise fallback to localStorage
  if (supabase) {
    const res = await supabase.auth.signUp({ email, password }, { data: { name } });
    if (res.error) return { user: null, error: res.error };
    // res.data.user may be undefined until confirmation; map if present
    const su = res.data.user;
    if (su) {
      const user = mapSupabaseUserToAppUser(su);
      // persist minimal copy locally for app compatibility
      addUser(user);
      setCurrentUser(user);
      return { user, error: null };
    }
    return { user: null, error: null };
  }

  // Local fallback: create user in localStorage
  const existing = getUserByEmail(email);
  if (existing) return { user: null, error: new Error('Email already registered') };
  const newUser: AppUser = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    password,
    avatar: '',
    purchasedCourses: [],
    progress: {},
    createdAt: new Date().toISOString(),
  };
  addUser(newUser);
  setCurrentUser(newUser);
  return { user: newUser, error: null };
}

export async function signIn(email: string, password: string) {
  if (supabase) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) return { user: null, error: res.error };
    const su = res.data.user;
    if (su) {
      const user = mapSupabaseUserToAppUser(su);
      // ensure local copy
      addUser(user);
      setCurrentUser(user);
      return { user, error: null };
    }
    return { user: null, error: null };
  }

  // Local fallback: simple check against local users
  const existing = getUserByEmail(email);
  if (!existing) return { user: null, error: new Error('Usuário não encontrado') };
  if (existing.password !== password) return { user: null, error: new Error('Senha incorreta') };
  setCurrentUser(existing);
  return { user: existing, error: null };
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localLogout();
}

export async function getUser() {
  if (supabase) {
    const res = await supabase.auth.getUser();
    if (res.error) return { user: null, error: res.error };
    const su = res.data.user;
    if (!su) return { user: null, error: null };
    const user = mapSupabaseUserToAppUser(su);
    // keep local copy
    addUser(user);
    setCurrentUser(user);
    return { user, error: null };
  }

  const user = getCurrentUser();
  return { user, error: null };
}

export default { signUp, signIn, signOut, getUser };
