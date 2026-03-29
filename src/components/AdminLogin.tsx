import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield } from 'lucide-react';

interface AdminLoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function AdminLogin({ onBack, onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      // Check admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Tidak dapat mendapatkan user');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Akun ini bukan admin');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="text-center space-y-3">
          <Shield className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Admin Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email admin..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card border-border text-foreground h-12"
          />
          <Input
            type="password"
            placeholder="Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-card border-border text-foreground h-12"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-12 font-heading font-semibold">
            {loading ? 'Loading...' : 'Login Admin'}
          </Button>
        </form>
      </div>
    </div>
  );
}
