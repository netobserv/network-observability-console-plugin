import { useEffect, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Slightly modified from Dan Abramov's blog post about using React hooks for polling
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const usePoll = (callback: () => void, delay?: number, ...dependencies: any) => {
  const savedCallback = useRef(null);

  // Remember the latest callback.
  useEffect(() => {
    // eslint-disable-next-line no-underscore-dangle
    savedCallback.current = callback as any;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    const tick = () => (savedCallback.current as any)();

    tick(); // Run first tick immediately.

    if (delay) {
      // Only start interval if a delay is provided.
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...dependencies]);
};
