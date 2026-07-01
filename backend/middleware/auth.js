const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verifies the JWT sent in the Authorization header (Bearer <token>)
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
}

// Restricts a route to a specific role: "staff" or "student"
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Access restricted to ${role} accounts.` });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
