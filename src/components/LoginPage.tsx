import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tv, Lock, User, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginPageProps {
  onLogin: (username: string) => Promise<void>;
  onAdminClick: () => void;
}

export function LoginPage({ onLogin, onAdminClick }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiredCode, setRequiredCode] = useState('');

  useEffect(() => {
    // Fetch access code from first server setting
    supabase.from('stream_settings').select('access_code').limit(1).then(({ data }) => {
      if (data && data.length > 0 && (data[0] as any).access_code) {
        setRequiredCode((data[0] as any).access_code);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Check access code if one is set
    if (requiredCode && accessCode !== requiredCode) {
      setError('Kode akses salah!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onLogin(username.trim());
    } catch (err: any) {
      setError(err.message || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <Tv className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">FOUR48</h1>
          <p className="text-muted-foreground text-sm mt-1">Live Streaming Platform</p>
        </div>

        {/* Login form */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-muted border-0 text-foreground placeholder:text-muted-foreground h-12 text-sm pl-10 rounded-xl"
                  maxLength={20}
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Kode Akses"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-muted border-0 text-foreground placeholder:text-muted-foreground h-12 text-sm pl-10 rounded-xl"
                  maxLength={20}
                  type="password"
                />
              </div>
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-destructive text-xs">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full h-12 text-sm font-heading font-semibold rounded-xl"
            >
              {loading ? 'Memuat...' : 'Masuk ke Stream'}
            </Button>
          </form>
        </div>

        <button
          onClick={onAdminClick}
          className="flex items-center justify-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Lock className="w-3 h-3" />
          Admin Panel
        </button>
      </div>
    </div>
  );
}
