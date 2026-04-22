'use client';

import { useEffect, useState } from 'react';
import { formatTimeRemaining } from '@/lib/utils';

interface CountdownTimerProps {
  targetTimestamp: bigint;
  onExpire?: () => void;
}

export function CountdownTimer({ targetTimestamp, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(targetTimestamp));

  useEffect(() => {
    const update = () => {
      const remaining = formatTimeRemaining(targetTimestamp);
      setTimeLeft(remaining);
      if (remaining === 'Ended' && onExpire) {
        onExpire();
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, onExpire]);

  return <span>{timeLeft}</span>;
}
