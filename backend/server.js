import app from './app.js';
import connectDB from './config/database.js';
import { config, validateEnvironment } from './config/env.js';

try {
  validateEnvironment();
  await connectDB();
  console.log('Connected to MongoDB');
  const server = app.listen(config.port, () => {
    console.log('MathVui API listening on port ' + config.port);
  });
  server.on('error', (error) => {
    console.error('Cannot listen: ' + error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('Cannot start MathVui API: ' + error.message);
  process.exitCode = 1;
}
