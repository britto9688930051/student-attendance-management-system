const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");

// GET /api/students  — list all students (staff only)
router.get("/", verifyToken, requireRole("staff"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, roll_no, name, class, created_at FROM students ORDER BY roll_no"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching students." });
  }
});

// GET /api/students/:id — single student profile (staff, or the student themself)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "student" && String(req.user.id) !== String(id)) {
      return res.status(403).json({ message: "You can only view your own profile." });
    }

    const [rows] = await pool.query(
      "SELECT id, roll_no, name, class, created_at FROM students WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching student." });
  }
});

module.exports = router;
