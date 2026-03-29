import { useState, useEffect } from 'react';
import { useViewer } from '@/hooks/useViewer';
import { LoginPage } from '@/components/LoginPage';
import { AdminLogin } from '@/components/AdminLogin';
import { StreamPage } from '@/components/StreamPage';
import { AdminPanel } from '@/components/AdminPanel';
import { supabase } from '@/integrations/supabase/client';

type View = 'login' | 'admin-login' | 'stream' | 'admin-panel';

const Index = () => {
  const { viewer, loading, login, logout, banned } = useViewer();
  const [view, setView] = useState<View>('login');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .then(({ data }) => {
            if (data && data.length > 0) {
              setIsAdmin(true);
            }
          });
      } else {
        setIsAdmin(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!loading && viewer) {
      setView('stream');
    }
  }, [loading, viewer]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-heading">Loading...</p>
      </div>
    );
  }

  if (view === 'admin-panel') {
    return <AdminPanel />;
  }

  if (view === 'admin-login') {
    return (
      <AdminLogin
        onBack={() => setView('login')}
        onSuccess={() => setView('admin-panel')}
      />
    );
  }

  if (view === 'stream' && viewer) {
    return (
      <StreamPage
        viewerId={viewer.id}
        username={viewer.username}
        onLogout={() => { logout(); setView('login'); }}
        onAdminClick={isAdmin ? () => setView('admin-panel') : undefined}
      />
    );
  }

  return (
    <LoginPage
      onLogin={async (username) => {
        await login(username);
        setView('stream');
      }}
      onAdminClick={() => setView('admin-login')}
    />
  );
};

export default Index;
