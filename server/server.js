import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");

const requiredEnv = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME"
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

let db = null;
if (missingEnv.length === 0) {
  db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  console.warn(`[Info] Database MySQL belum dikonfigurasi: ${missingEnv.join(", ")}. Server tetap berjalan untuk file statis.`);
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

async function initializeDatabase() {
  if (!db) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL,
      kategori VARCHAR(100) NOT NULL,
      deskripsi TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'baru',
      tanggal DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key VARCHAR(150) PRIMARY KEY,
      state_value LONGTEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log("Database berhasil diinisialisasi");
}
app.get("/api/health", async (_req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        ok: false,
        database: "disconnected"
      });
    }

    await db.query("SELECT 1");

    res.json({
      ok: true,
      database: "connected"
    });
  } catch (error) {
    console.error("Health check database gagal:", error.message);

    res.status(500).json({
      ok: false,
      database: "disconnected"
    });
  }
});

app.get("/api/bantuan", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        nama,
        email,
        kategori,
        deskripsi,
        status,
        tanggal,
        created_at,
        updated_at
      FROM app_records
      ORDER BY tanggal DESC, id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Gagal membaca data bantuan:", error.message);
    res.status(500).json({
      error: "Gagal membaca data bantuan"
    });
  }
});

app.post("/api/bantuan", async (req, res) => {
  try {
    const {
      nama,
      email,
      kategori,
      deskripsi,
      status = "baru",
      tanggal
    } = req.body;

    if (!nama || !email || !kategori || !deskripsi) {
      return res.status(400).json({
        error: "nama, email, kategori, dan deskripsi wajib diisi"
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO app_records
          (nama, email, kategori, deskripsi, status, tanggal)
        VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `,
      [
        nama,
        email,
        kategori,
        deskripsi,
        status,
        tanggal || null
      ]
    );

    const [rows] = await db.query(
      "SELECT * FROM app_records WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Gagal menyimpan data bantuan:", error.message);
    res.status(500).json({
      error: "Gagal menyimpan data bantuan"
    });
  }
});

app.put("/api/bantuan/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "status wajib diisi"
      });
    }

    const [result] = await db.query(
      `
        UPDATE app_records
        SET status = ?
        WHERE id = ?
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Data bantuan tidak ditemukan"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM app_records WHERE id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("Gagal memperbarui status:", error.message);
    res.status(500).json({
      error: "Gagal memperbarui status"
    });
  }
});

app.delete("/api/bantuan/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM app_records WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Data bantuan tidak ditemukan"
      });
    }

    res.json({
      ok: true,
      message: "Data bantuan berhasil dihapus"
    });
  } catch (error) {
    console.error("Gagal menghapus data bantuan:", error.message);
    res.status(500).json({
      error: "Gagal menghapus data bantuan"
    });
  }
});
app.get("/api/state", async (_req, res) => {
  if (!db) {
    return res.status(503).json({
      error: "Database MySQL belum tersedia"
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT state_key, state_value FROM app_state"
    );

    const state = Object.fromEntries(
      rows.map((row) => [row.state_key, row.state_value])
    );

    res.json(state);
  } catch (error) {
    console.error("Gagal membaca state aplikasi:", error.message);

    res.status(500).json({
      error: "Gagal membaca state aplikasi"
    });
  }
});

app.put("/api/state", async (req, res) => {
  if (!db) {
    return res.status(503).json({
      error: "Database MySQL belum tersedia"
    });
  }

  const { key, value } = req.body;

  if (typeof key !== "string" || !key) {
    return res.status(400).json({
      error: "key wajib diisi"
    });
  }

  if (typeof value !== "string") {
    return res.status(400).json({
      error: "value harus berupa teks"
    });
  }

  try {
    await db.query(
      `
        INSERT INTO app_state (state_key, state_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          state_value = VALUES(state_value),
          updated_at = CURRENT_TIMESTAMP
      `,
      [key, value]
    );

    res.json({
      ok: true
    });
  } catch (error) {
    console.error("Gagal menyimpan state aplikasi:", error.message);

    res.status(500).json({
      error: "Gagal menyimpan state aplikasi"
    });
  }
});

app.delete("/api/state/:key", async (req, res) => {
  if (!db) {
    return res.status(503).json({
      error: "Database MySQL belum tersedia"
    });
  }

  try {
    await db.query(
      "DELETE FROM app_state WHERE state_key = ?",
      [req.params.key]
    );

    res.json({
      ok: true
    });
  } catch (error) {
    console.error("Gagal menghapus state aplikasi:", error.message);

    res.status(500).json({
      error: "Gagal menghapus state aplikasi"
    });
  }
});

app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

initializeDatabase()
  .catch((error) => {
    console.error("Database gagal diinisialisasi:", error.message);
  })
  .finally(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server berjalan pada port ${port}`);
    });
  });
