import { useEffect, useRef } from 'react';

// Slightly modified from Dan Abramov's blog post about using React hooks for polling
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const usePoll = (callback: () => void, delay?: number, dependencies?: React.DependencyList) => {
  const savedCallback = useRef<(() => void) | null>(null);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    const tick = () => (savedCallback?.current ? savedCallback.current() : null);

    tick(); // Run first tick immediately.

    if (delay) {
      // Only start interval if a delay is provided.
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    // Note on eslint disabled: static check of deps doesn't work here because it's not an array literal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay].concat(dependencies));
};
