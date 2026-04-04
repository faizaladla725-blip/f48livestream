import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radio, KeyRound, User, Lock } from 'lucide-react';
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
    supabase.from('stream_settings').select('access_code').limit(1).then(({ data }) => {
      if (data && data.length > 0 && (data[0] as any).access_code) {
        setRequiredCode((data[0] as any).access_code);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    if (requiredCode && accessCode !== requiredCode) {
      setError('Kode akses salah!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onLogin(username.trim());
    } catch (err: any) {
      setError(err.message || 'Gagal masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/50 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-primary/20 border border-primary/20">
            <Radio className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">FOUR48</h1>
          <p className="text-muted-foreground text-xs mt-1.5 font-medium">Live Streaming Platform</p>
        </div>

        <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/20 p-6 space-y-5 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-muted/30 border-border/20 text-foreground placeholder:text-muted-foreground/50 h-12 text-sm pl-11 rounded-2xl focus:border-primary/40 focus:ring-primary/20 transition-all"
                maxLength={20}
              />
            </div>

            {requiredCode && (
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Kode Akses"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-muted/30 border-border/20 text-foreground placeholder:text-muted-foreground/50 h-12 text-sm pl-11 rounded-2xl focus:border-primary/40 focus:ring-primary/20 transition-all"
                  maxLength={20}
                  type="password"
                />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2.5">
                <p className="text-destructive text-xs font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading || !username.trim()} className="w-full h-12 text-sm font-heading font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              {loading ? 'Memuat...' : 'Masuk'}
            </Button>
          </form>
        </div>

        <button
          onClick={onAdminClick}
          className="flex items-center justify-center gap-1.5 mx-auto mt-6 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        >
          <Lock className="w-2.5 h-2.5" />
          Admin
        </button>
      </div>
    </div>
  );
}
