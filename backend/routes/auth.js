const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const TOKEN_EXPIRY = "8h";

// ---------------------------------------------
// STAFF REGISTER
// POST /api/auth/staff/register
// ---------------------------------------------
router.post("/staff/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required." });
    }

    const [existing] = await pool.query("SELECT id FROM staff WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO staff (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "Staff account created.", staffId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while registering staff." });
  }
});

// ---------------------------------------------
// STAFF LOGIN
// POST /api/auth/staff/login
// ---------------------------------------------
router.post("/staff/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM staff WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const staff = rows[0];
    const match = await bcrypt.compare(password, staff.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: staff.id, role: "staff", name: staff.name },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: staff.id, name: staff.name, email: staff.email, role: "staff" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during staff login." });
  }
});

// ---------------------------------------------
// STUDENT REGISTER
// POST /api/auth/student/register
// ---------------------------------------------
router.post("/student/register", async (req, res) => {
  try {
    const { roll_no, name, password, class: studentClass } = req.body;
    if (!roll_no || !name || !password) {
      return res.status(400).json({ message: "roll_no, name and password are required." });
    }

    const [existing] = await pool.query("SELECT id FROM students WHERE roll_no = ?", [roll_no]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "A student with this roll number already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO students (roll_no, name, password, class) VALUES (?, ?, ?, ?)",
      [roll_no, name, hashedPassword, studentClass || null]
    );

    res.status(201).json({ message: "Student account created.", studentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while registering student." });
  }
});

// ---------------------------------------------
// STUDENT LOGIN
// POST /api/auth/student/login
// ---------------------------------------------
router.post("/student/login", async (req, res) => {
  try {
    const { roll_no, password } = req.body;
    if (!roll_no || !password) {
      return res.status(400).json({ message: "roll_no and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM students WHERE roll_no = ?", [roll_no]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid roll number or password." });
    }

    const student = rows[0];
    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid roll number or password." });
    }

    const token = jwt.sign(
      { id: student.id, role: "student", name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: student.id, name: student.name, roll_no: student.roll_no, role: "student" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during student login." });
  }
});

module.exports = router;
