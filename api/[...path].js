module.exports = async function handler(req, res) {
  try {
    const mod = await import(new URL('./[...path].mjs', import.meta ? import.meta.url : `file://${__filename}`));
    const fn = mod.default || mod.handler || mod;
    return await fn(req, res);
  } catch (err) {
    console.error('Fallback wrapper failed to load ESM handler:', err);
    try {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error', details: String(err) }));
    } catch (e) {
      // ignore
    }
  }
};
