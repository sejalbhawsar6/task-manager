require('dotenv').config({ quiet: true });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('Missing MONGO_URI or JWT_SECRET in environment. Check your .env file.');
    process.exit(1);
  }
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
};

start();
