import { config } from './config.js';
import { createApp } from './app.js';

const app = createApp();

// On Vercel the app is exported as a serverless handler; everywhere else (local, VM, container) we listen on a port,
// including with NODE_ENV=production.
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

export default app;
