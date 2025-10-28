import { startServer } from './server';

async function main() {
  await startServer();
}

main().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
