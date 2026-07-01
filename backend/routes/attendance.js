const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");

// ---------------------------------------------
// GET /api/attendance/subjects — list subjects
// ---------------------------------------------
router.get("/subjects", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, subject_name, subject_code FROM subjects ORDER BY subject_name"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching subjects." });
  }
});

// ---------------------------------------------
// POST /api/attendance/mark — staff marks attendance for a subject/date
// body: { subject_id, date, records: [{ student_id, status }] }
// ---------------------------------------------
router.post("/mark", verifyToken, requireRole("staff"), async (req, res) => {
  const { subject_id, date, records } = req.body;

  if (!subject_id || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "subject_id, date and records[] are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const upsertQuery = `
      INSERT INTO attendance (student_id, subject_id, attendance_date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)
    `;

    for (const record of records) {
      const { student_id, status } = record;
      if (!student_id || !["Present", "Absent"].includes(status)) continue;
      await connection.query(upsertQuery, [student_id, subject_id, date, status, req.user.id]);
    }

    await connection.commit();
    res.json({ message: "Attendance saved successfully.", count: records.length });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error while saving attendance." });
  } finally {
    connection.release();
  }
});

// ---------------------------------------------
// GET /api/attendance/mark?subject_id=&date= — fetch existing entries to prefill the form
// ---------------------------------------------
router.get("/mark", verifyToken, requireRole("staff"), async (req, res) => {
  try {
    const { subject_id, date } = req.query;
    if (!subject_id || !date) {
      return res.status(400).json({ message: "subject_id and date query params are required." });
    }

    const [students] = await pool.query("SELECT id, roll_no, name FROM students ORDER BY roll_no");
    const [existing] = await pool.query(
      "SELECT student_id, status FROM attendance WHERE subject_id = ? AND attendance_date = ?",
      [subject_id, date]
    );

    const statusMap = {};
    existing.forEach((e) => (statusMap[e.student_id] = e.status));

    const merged = students.map((s) => ({
      student_id: s.id,
      roll_no: s.roll_no,
      name: s.name,
      status: statusMap[s.id] || "Present",
    }));

    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while loading attendance sheet." });
  }
});

// ---------------------------------------------
// GET /api/attendance/report/:subject_id — per-subject report with percentages (staff)
// ---------------------------------------------
router.get("/report/:subject_id", verifyToken, requireRole("staff"), async (req, res) => {
  try {
    const { subject_id } = req.params;

    const query = `
      SELECT
        s.id AS student_id,
        s.roll_no,
        s.name,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2
        ) AS percentage
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.subject_id = ?
      GROUP BY s.id, s.roll_no, s.name
      ORDER BY s.roll_no
    `;

    const [rows] = await pool.query(query, [subject_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while generating report." });
  }
});

// ---------------------------------------------
// GET /api/attendance/student/:student_id — a student's own attendance across all subjects
// Accessible to staff, or to the student viewing their own record
// ---------------------------------------------
router.get("/student/:student_id", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === "student" && String(req.user.id) !== String(student_id)) {
      return res.status(403).json({ message: "You can only view your own attendance." });
    }

    const query = `
      SELECT
        sub.id AS subject_id,
        sub.subject_name,
        sub.subject_code,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2
        ) AS percentage
      FROM subjects sub
      LEFT JOIN attendance a ON a.subject_id = sub.id AND a.student_id = ?
      GROUP BY sub.id, sub.subject_name, sub.subject_code
      ORDER BY sub.subject_name
    `;

    const [rows] = await pool.query(query, [student_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching student attendance." });
  }
});

module.exports = router;
