import config from './config/env.js';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './db/connect.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

// Connect DB after listen so /health works even if Mongo is briefly down
connectDB(config.mongoUri).catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});

// ---- Graceful shutdown ----
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Unexpected errors: log and exit — a supervisor (pm2/systemd) restarts cleanly
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  shutdown('unhandledRejection');
});
