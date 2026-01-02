import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/localStorage';

export default function AdminRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          if (mounted) { setAllowed(false); setLoading(false); }
          return;
        }

        if (!supabase) {
          // No supabase configured — fallback: allow only default admin email
          if (mounted) setAllowed(user.email === 'admin@admin.com');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          if (mounted) { setAllowed(false); setLoading(false); }
          return;
        }

        if (profile.role === 'admin') {
          if (mounted) setAllowed(true);
          return;
        }

        // If no specific permission requested, allow moderators by default
        if (!permission) {
          if (mounted) setAllowed(profile.role === 'moderator');
          return;
        }

        // For moderators, check user_permissions table
        const { data: permissionsData } = await supabase
          .from('user_permissions')
          .select('permission_key')
          .eq('user_id', user.id);

        const permKeys = (permissionsData || []).map((p: any) => p.permission_key);
        if (mounted) setAllowed(permKeys.includes(permission));
      } catch (e) {
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [permission]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
