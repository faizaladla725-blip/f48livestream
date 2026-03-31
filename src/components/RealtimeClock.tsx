import { useState, useEffect } from 'react';

export function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="text-center">
      <p className="text-[10px] font-heading font-bold text-foreground tabular-nums">{timeStr}</p>
      <p className="text-[8px] text-muted-foreground leading-none">{dateStr}</p>
    </div>
  );
}
