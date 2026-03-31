import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tv, Lock, Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginPageProps {
  onLogin: (username: string) => Promise<void>;
  onAdminClick: () => void;
}

export function LoginPage({ onLogin, onAdminClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiredCode, setRequiredCode] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    supabase.from('stream_settings').select('access_code').limit(1).then(({ data }) => {
      if (data && data.length > 0 && (data[0] as any).access_code) {
        setRequiredCode((data[0] as any).access_code);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (requiredCode && accessCode !== requiredCode) {
      setError('Kode akses salah!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        const { error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signupError) throw signupError;
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
      }
      // Use email prefix as display name
      await onLogin(email.trim().split('@')[0]);
    } catch (err: any) {
      setError(err.message || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-3 border border-primary/20 shadow-lg shadow-primary/5">
            <Tv className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">FOUR48</h1>
          <p className="text-muted-foreground text-xs mt-1">Live Streaming Platform</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50 border-border/30 text-foreground placeholder:text-muted-foreground h-11 text-sm pl-10 rounded-xl"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 border-border/30 text-foreground placeholder:text-muted-foreground h-11 text-sm pl-10 pr-10 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {requiredCode && (
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Kode Akses"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-muted/50 border-border/30 text-foreground placeholder:text-muted-foreground h-11 text-sm pl-10 rounded-xl"
                  maxLength={20}
                  type="password"
                />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-destructive text-xs">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading || !email.trim() || !password.trim()} className="w-full h-11 text-sm font-heading font-semibold rounded-xl">
              {loading ? 'Memuat...' : isSignup ? 'Daftar' : 'Masuk'}
            </Button>

            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              {isSignup ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </form>
        </div>

        <button
          onClick={onAdminClick}
          className="flex items-center justify-center gap-1.5 mx-auto mt-5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Lock className="w-2.5 h-2.5" />
          Admin
        </button>
      </div>
    </div>
  );
}
