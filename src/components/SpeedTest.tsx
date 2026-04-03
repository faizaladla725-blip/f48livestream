import { useState, useCallback } from 'react';
import { Wifi, WifiOff, Gauge, Loader2 } from 'lucide-react';

type SpeedResult = {
  mbps: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  recommendation: string;
};

function getSpeedResult(mbps: number): SpeedResult {
  if (mbps >= 10) return { mbps, quality: 'excellent', label: 'Excellent', recommendation: '1080p smooth' };
  if (mbps >= 5) return { mbps, quality: 'good', label: 'Good', recommendation: '720p smooth' };
  if (mbps >= 2) return { mbps, quality: 'fair', label: 'Fair', recommendation: '480p recommended' };
  return { mbps, quality: 'poor', label: 'Poor', recommendation: 'Low quality only' };
}

const qualityColors: Record<string, string> = {
  excellent: 'text-green-400',
  good: 'text-emerald-400',
  fair: 'text-yellow-400',
  poor: 'text-red-400',
};

const qualityBg: Record<string, string> = {
  excellent: 'bg-green-400/10 border-green-400/20',
  good: 'bg-emerald-400/10 border-emerald-400/20',
  fair: 'bg-yellow-400/10 border-yellow-400/20',
  poor: 'bg-red-400/10 border-red-400/20',
};

export function SpeedTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [open, setOpen] = useState(false);

  const runTest = useCallback(async () => {
    setTesting(true);
    setResult(null);
    try {
      // Download ~1MB of data and measure time
      const testUrl = `https://speed.cloudflare.com/__down?bytes=1000000&r=${Date.now()}`;
      const start = performance.now();
      const res = await fetch(testUrl, { cache: 'no-store' });
      await res.arrayBuffer();
      const elapsed = (performance.now() - start) / 1000; // seconds
      const mbps = (1 * 8) / elapsed; // 1MB = 8Mb
      setResult(getSpeedResult(Math.round(mbps * 10) / 10));
    } catch {
      setResult({ mbps: 0, quality: 'poor', label: 'Failed', recommendation: 'Check your connection' });
    }
    setTesting(false);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        title="Speed Test"
      >
        <Gauge className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border/40 rounded-2xl p-5 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-heading font-bold text-foreground">Speed Test</h3>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>

        {/* Result */}
        {result && !testing && (
          <div className={`rounded-xl border p-4 text-center space-y-2 ${qualityBg[result.quality]}`}>
            <div className="flex items-center justify-center gap-1">
              {result.quality === 'poor' ? <WifiOff className={`w-5 h-5 ${qualityColors[result.quality]}`} /> : <Wifi className={`w-5 h-5 ${qualityColors[result.quality]}`} />}
            </div>
            <div className={`text-2xl font-heading font-bold ${qualityColors[result.quality]}`}>
              {result.mbps} <span className="text-xs font-normal">Mbps</span>
            </div>
            <div className={`text-xs font-semibold ${qualityColors[result.quality]}`}>{result.label}</div>
            <div className="text-[10px] text-muted-foreground">{result.recommendation}</div>
          </div>
        )}

        {/* Testing animation */}
        {testing && (
          <div className="rounded-xl border border-border/30 bg-secondary/20 p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Testing speed...</span>
          </div>
        )}

        {/* No result yet */}
        {!result && !testing && (
          <div className="rounded-xl border border-border/30 bg-secondary/20 p-6 flex flex-col items-center gap-2">
            <Wifi className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground">Check your connection speed</span>
          </div>
        )}

        <button
          onClick={runTest}
          disabled={testing}
          className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-heading font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {testing ? 'Testing...' : result ? 'Test Again' : 'Start Test'}
        </button>
      </div>
    </div>
  );
}
