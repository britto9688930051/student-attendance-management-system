const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "attendance_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Cloud MySQL providers (Aiven, PlanetScale, Railway, etc.) require SSL.
  // Set DB_SSL=true in your environment variables when deploying.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;