import { useState, useEffect } from 'react';

export function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dateStr = `${days[time.getDay()]}, ${time.getDate()} ${months[time.getMonth()]}`;

  return (
    <div className="text-center bg-card/40 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-border/15">
      <p className="text-[11px] font-heading font-bold text-foreground tabular-nums tracking-wider">
        {hours}<span className="text-primary animate-pulse">:</span>{minutes}<span className="text-primary animate-pulse">:</span>{seconds}
      </p>
      <p className="text-[8px] text-muted-foreground leading-none mt-0.5 font-medium">{dateStr}</p>
    </div>
  );
}
