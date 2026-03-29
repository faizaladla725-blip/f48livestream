import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radio, Tv } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string) => Promise<void>;
  onAdminClick: () => void;
}

export function LoginPage({ onLogin, onAdminClick }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
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
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Tv className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold text-foreground">FOUR48</h1>
          </div>
          <p className="text-muted-foreground text-sm">Live Streaming Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Masukkan username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
              maxLength={20}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full h-12 text-base font-heading font-semibold"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </Button>
        </form>

        <button
          onClick={onAdminClick}
          className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Login sebagai Admin
        </button>
      </div>
    </div>
  );
}
