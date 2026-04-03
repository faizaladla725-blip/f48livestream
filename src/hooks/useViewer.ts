import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';

const VIEWER_KEY = 'four48_viewer';
const SESSION_KEY = 'four48_session';

interface Viewer {
  id: string;
  username: string;
  device_id: string;
  session_token: string;
}

export function useViewer() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);

  // Check auto-logout on mount
  useEffect(() => {
    const stored = localStorage.getItem(VIEWER_KEY);
    const storedSession = localStorage.getItem(SESSION_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      supabase
        .from('viewers')
        .select('is_banned, session_token')
        .eq('id', parsed.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.is_banned) {
            setBanned(true);
            localStorage.removeItem(VIEWER_KEY);
            localStorage.removeItem(SESSION_KEY);
            setViewer(null);
          } else if (data?.session_token && storedSession && data.session_token !== storedSession) {
            localStorage.removeItem(VIEWER_KEY);
            localStorage.removeItem(SESSION_KEY);
            setViewer(null);
          } else {
            setViewer(parsed);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);


  const login = async (username: string) => {
    const deviceId = getDeviceId();
    const sessionToken = crypto.randomUUID();

    const { data: existing } = await supabase
      .from('viewers')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing) {
      if (existing.is_banned) {
        setBanned(true);
        throw new Error('Akun kamu telah di-banned oleh admin');
      }

      await supabase
        .from('viewers')
        .update({
          username,
          is_online: true,
          last_seen: new Date().toISOString(),
          session_token: sessionToken,
        })
        .eq('id', existing.id);

      const v: Viewer = { id: existing.id, username, device_id: deviceId, session_token: sessionToken };
      localStorage.setItem(VIEWER_KEY, JSON.stringify(v));
      localStorage.setItem(SESSION_KEY, sessionToken);
      localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
      setViewer(v);
      return v;
    }

    const { data, error } = await supabase
      .from('viewers')
      .insert({ username, device_id: deviceId, is_online: true, session_token: sessionToken })
      .select()
      .single();

    if (error) throw error;

    const v: Viewer = { id: data.id, username: data.username, device_id: data.device_id, session_token: sessionToken };
    localStorage.setItem(VIEWER_KEY, JSON.stringify(v));
    localStorage.setItem(SESSION_KEY, sessionToken);
    localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
    setViewer(v);
    return v;
  };

  const logout = () => {
    if (viewer) {
      supabase
        .from('viewers')
        .update({ is_online: false, session_token: null })
        .eq('id', viewer.id)
        .then(() => {});
    }
    localStorage.removeItem(VIEWER_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
    setViewer(null);
  };

  // Auto-offline on page close
  useEffect(() => {
    if (!viewer) return;

    const markOffline = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/viewers?id=eq.${viewer.id}`;
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ is_online: false }),
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markOffline();
      } else if (document.visibilityState === 'visible') {
        supabase
          .from('viewers')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', viewer.id)
          .then(() => {});
      }
    };

    window.addEventListener('beforeunload', markOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', markOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewer]);

  // Heartbeat + session validation
  useEffect(() => {
    if (!viewer) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('viewers')
        .select('session_token, is_banned')
        .eq('id', viewer.id)
        .maybeSingle();

      if (data?.is_banned) {
        setBanned(true);
        localStorage.removeItem(VIEWER_KEY);
        localStorage.removeItem(SESSION_KEY);
        setViewer(null);
        return;
      }

      const localSession = localStorage.getItem(SESSION_KEY);
      if (data?.session_token && localSession && data.session_token !== localSession) {
        localStorage.removeItem(VIEWER_KEY);
        localStorage.removeItem(SESSION_KEY);
        setViewer(null);
        return;
      }

      await supabase
        .from('viewers')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', viewer.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [viewer]);

  return { viewer, loading, login, logout, banned };
}
