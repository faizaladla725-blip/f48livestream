import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tv, Lock, User, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginPageProps {
  onLogin: (username: string) => Promise<void>;
  onAdminClick: () => void;
}

export function LoginPage({ onLogin, onAdminClick }: LoginPageProps) {
  const [mode, setMode] = useState<'username' | 'account'>('username');
  const [username, setUsername] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleUsernameSubmit = async (e: React.FormEvent) => {
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
      setError(err.message || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
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
        // After signup, login as viewer with email as username
        await onLogin(email.trim().split('@')[0]);
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
        await onLogin(email.trim().split('@')[0]);
      }
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
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <Tv className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">FOUR48</h1>
          <p className="text-muted-foreground text-sm mt-1">Live Streaming Platform</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'username' ? 'default' : 'secondary'}
            onClick={() => { setMode('username'); setError(''); }}
            className="flex-1 rounded-xl h-10 font-heading"
            size="sm"
          >
            <User className="w-4 h-4 mr-1.5" /> Username
          </Button>
          <Button
            variant={mode === 'account' ? 'default' : 'secondary'}
            onClick={() => { setMode('account'); setError(''); }}
            className="flex-1 rounded-xl h-10 font-heading"
            size="sm"
          >
            <Mail className="w-4 h-4 mr-1.5" /> Akun
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          {mode === 'username' ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
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
              <Button type="submit" disabled={loading || !username.trim()} className="w-full h-12 text-sm font-heading font-semibold rounded-xl">
                {loading ? 'Memuat...' : 'Masuk ke Stream'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted border-0 text-foreground placeholder:text-muted-foreground h-12 text-sm pl-10 rounded-xl"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted border-0 text-foreground placeholder:text-muted-foreground h-12 text-sm pl-10 pr-10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
              <Button type="submit" disabled={loading || !email.trim() || !password.trim()} className="w-full h-12 text-sm font-heading font-semibold rounded-xl">
                {loading ? 'Memuat...' : isSignup ? 'Daftar & Masuk' : 'Login & Masuk'}
              </Button>
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError(''); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignup ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
              </button>
            </form>
          )}
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
