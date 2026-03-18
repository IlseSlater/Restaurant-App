/**
 * Must run before any other app code so the HTTP/2 status-message warning is suppressed
 * when Nest/Express set res.statusMessage (HTTP/2 RFC 7540 does not use status messages).
 */
const originalEmit = process.emit.bind(process);
(process as { emit: (...a: unknown[]) => unknown }).emit = function (event: unknown, ...args: unknown[]): unknown {
  if (event === 'warning' && args[0] && typeof args[0] === 'object') {
    const msg = String((args[0] as { message?: string }).message ?? '');
    if (msg.includes('Status message is not supported by HTTP/2')) return true;
  }
  return (originalEmit as (...a: unknown[]) => unknown)(event, ...args);
};
