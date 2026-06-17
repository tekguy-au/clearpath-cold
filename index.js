const http = require('http');
const { WebSocketServer } = require('ws');
const { randomUUID } = require('crypto');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/health') {
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Create a new tracking session
  if (url.pathname === '/session' && req.method === 'POST') {
    const id = randomUUID().split('-')[0]; // short ID e.g. "a3f9b2c1"
    sessions[id] = { location: null, watchers: new Set() };
    console.log(`Session created: ${id}`);
    res.end(JSON.stringify({ id }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocketServer({ server });

// sessions: { [id]: { location: {lat,lng,heading,speed,ts}, watchers: Set<ws> } }
const sessions = {};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  const role = url.searchParams.get('role'); // 'driver' or 'watcher'

  if (!id || !sessions[id]) {
    ws.send(JSON.stringify({ error: 'Invalid session' }));
    ws.close();
    return;
  }

  const session = sessions[id];
  console.log(`${role} connected to session ${id}`);

  if (role === 'watcher') {
    session.watchers.add(ws);

    // Send last known location immediately
    if (session.location) {
      ws.send(JSON.stringify({ type: 'location', ...session.location }));
    } else {
      ws.send(JSON.stringify({ type: 'waiting' }));
    }

    ws.on('close', () => {
      session.watchers.delete(ws);
      console.log(`Watcher disconnected from ${id}`);
    });
  }

  if (role === 'driver') {
    // Send confirmation
    ws.send(JSON.stringify({ type: 'ready', id }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'location') {
          session.location = {
            lat: msg.lat,
            lng: msg.lng,
            heading: msg.heading || null,
            speed: msg.speed || null,
            ts: Date.now()
          };

          // Broadcast to all watchers
          const payload = JSON.stringify({ type: 'location', ...session.location });
          session.watchers.forEach(w => {
            if (w.readyState === 1) w.send(payload);
          });
        }

        if (msg.type === 'delivered') {
          const payload = JSON.stringify({ type: 'delivered', ts: Date.now() });
          session.watchers.forEach(w => {
            if (w.readyState === 1) w.send(payload);
          });
          // Clean up after 10 mins
          setTimeout(() => delete sessions[id], 10 * 60 * 1000);
        }
      } catch (e) {
        console.error('Bad message:', e.message);
      }
    });

    ws.on('close', () => {
      console.log(`Driver disconnected from ${id}`);
    });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`ClearPath Cold tracking server on :${PORT}`));
