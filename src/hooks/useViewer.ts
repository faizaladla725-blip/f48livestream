import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';

const VIEWER_KEY = 'four48_viewer';

interface Viewer {
  id: string;
  username: string;
  device_id: string;
}

export function useViewer() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(VIEWER_KEY);
    if (stored) {
      setViewer(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (username: string) => {
    const deviceId = getDeviceId();

    // Check if device already registered
    const { data: existing } = await supabase
      .from('viewers')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing) {
      // Update username and set online
      await supabase
        .from('viewers')
        .update({ username, is_online: true, last_seen: new Date().toISOString() })
        .eq('id', existing.id);

      const v = { id: existing.id, username, device_id: deviceId };
      localStorage.setItem(VIEWER_KEY, JSON.stringify(v));
      setViewer(v);
      return v;
    }

    // New device
    const { data, error } = await supabase
      .from('viewers')
      .insert({ username, device_id: deviceId, is_online: true })
      .select()
      .single();

    if (error) throw error;

    const v = { id: data.id, username: data.username, device_id: data.device_id };
    localStorage.setItem(VIEWER_KEY, JSON.stringify(v));
    setViewer(v);
    return v;
  };

  const logout = () => {
    if (viewer) {
      supabase
        .from('viewers')
        .update({ is_online: false })
        .eq('id', viewer.id)
        .then(() => {});
    }
    localStorage.removeItem(VIEWER_KEY);
    setViewer(null);
  };

  // Heartbeat - keep online
  useEffect(() => {
    if (!viewer) return;
    const interval = setInterval(() => {
      supabase
        .from('viewers')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', viewer.id)
        .then(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [viewer]);

  return { viewer, loading, login, logout };
}
