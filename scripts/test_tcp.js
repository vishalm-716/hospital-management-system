const net = require('net');

const targets = [
  { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543 },
  { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432 },
];

targets.forEach(({ host, port }) => {
  const socket = new net.Socket();
  const start = Date.now();
  socket.setTimeout(4000);

  socket.on('connect', () => {
    console.log(`CONNECTED: ${host}:${port} in ${Date.now() - start}ms`);
    socket.destroy();
  });

  socket.on('timeout', () => {
    console.log(`TIMEOUT: ${host}:${port}`);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.log(`ERROR: ${host}:${port} -> ${err.message}`);
  });

  socket.connect(port, host);
});
