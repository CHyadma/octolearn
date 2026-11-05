import { networkInterfaces } from 'node:os';

import { createApp } from './app.js';
import { openDb } from './db.js';
import { syncSeed } from './seed.js';

const PORT = Number(process.env.PORT ?? 4000);
const db = openDb();
if (syncSeed(db)) console.log('Loaded course content from seed/course.json into the database');

createApp(db).listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
  console.log(`OctoLearn API on http://localhost:${PORT}`);
  if (lan.length) console.log(`From your phone (same Wi-Fi): ${lan.join(', ')}`);
});
