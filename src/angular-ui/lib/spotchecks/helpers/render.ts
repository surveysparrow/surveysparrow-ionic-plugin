// Runs fn once per microtask however often it is requested (many dispatches, one render).
export const batched = (fn: () => void) => {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      fn();
    });
  };
};
