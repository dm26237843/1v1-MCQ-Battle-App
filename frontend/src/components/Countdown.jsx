import { useEffect, useState } from 'react';

/** Match-level countdown: takes an ISO date (endsAt) and shows mm:ss */
export default function Countdown({ endsAt }) {
  const [remaining, setRemaining] = useState(() => timeLeft(endsAt));

  useEffect(() => {
    const t = setInterval(() => setRemaining(timeLeft(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!endsAt) return null;
  const mm = String(Math.max(0, Math.floor(remaining / 60))).padStart(2, '0');
  const ss = String(Math.max(0, Math.floor(remaining % 60))).padStart(2, '0');
  const danger = remaining <= 30;

  return <span className={danger ? 'text-red-600 font-semibold' : 'text-gray-700'}>{mm}:{ss}</span>;
}

function timeLeft(endsAt) {
  if (!endsAt) return 0;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}