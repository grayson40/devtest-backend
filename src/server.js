const app = require('./app');

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT)
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please try these steps:
      1. Kill any existing Node.js processes: pkill -f node
      2. Or try a different port by updating PORT in .env file
      3. Or check what's using the port: lsof -i :${PORT}`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  })
  .on('listening', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = server; 