import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './utils/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`UniSpace API listening on http://localhost:${env.port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
