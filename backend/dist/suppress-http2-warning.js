const originalEmit = process.emit.bind(process);
process.emit = function (event, ...args) {
    if (event === 'warning' && args[0] && typeof args[0] === 'object') {
        const msg = String(args[0].message ?? '');
        if (msg.includes('Status message is not supported by HTTP/2'))
            return true;
    }
    return originalEmit(event, ...args);
};
//# sourceMappingURL=suppress-http2-warning.js.map