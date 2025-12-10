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

export async function signUp(name: string, email: string, password: string, profileFields?: Record<string, any>) {
  // If supabase client is configured use it, otherwise fallback to localStorage
  if (supabase) {
    const res = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name }
      }
    });
    if (res.error) return { user: null, error: res.error };
    const su = res.data.user;
    if (su) {
      const user = mapSupabaseUserToAppUser(su);
      // persist minimal copy locally for app compatibility
      addUser(user);
      setCurrentUser(user);

      // Attempt to create/merge a full profile row in `public.profiles`.
      try {
        const profilePayload: any = {
          id: su.id,
          email: email,
          full_name: name,
          role: 'student',
          ...profileFields,
        };
        // upsert so re-running script is safe
        await supabase.from('profiles').upsert(profilePayload, { returning: 'minimal' });
      } catch (e) {
        // don't block signup on profile write; log to console for debugging
        // eslint-disable-next-line no-console
        console.warn('Could not upsert profile after signUp', e);
      }

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
  // Validate inputs
  if (!email || !password) {
    return { user: null, error: new Error('Email e senha são obrigatórios') };
  }
  
  if (supabase) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) return { user: null, error: res.error };
    const su = res.data.user;
    if (su) {
      const user = mapSupabaseUserToAppUser(su);
      
      // Fetch full profile data including name
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, whatsapp, cpf, purchased_courses')
          .eq('id', su.id)
          .single();
        
        if (profile) {
          user.name = profile.full_name || user.name;
          user.purchasedCourses = Array.isArray(profile.purchased_courses) ? profile.purchased_courses : [];
        }
      } catch (e) {
        // Continue with basic user data if profile fetch fails
      }
      
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
