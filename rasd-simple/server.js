import express from "express";
import multer from "multer";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "reports.sqlite"));
db.exec(`CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, branch TEXT, report_date TEXT NOT NULL,
  payload TEXT NOT NULL, file_name TEXT, created_at TEXT NOT NULL,
  telegram_status TEXT NOT NULL DEFAULT 'pending'
)`);
const upload = multer({
  dest: path.join(dataDir, "uploads"),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.mimetype);
    cb(ok ? null : new Error("يسمح فقط بالصور أو PDF"), ok);
  }
});
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const labels = {
  sales: "تقرير المبيعات",
  expenses: "تقرير المصروفات",
  waste: "تقرير التالف والهدر",
  maintenance: "تقرير الصيانة",
  staff: "تقييم الموظفين"
};
const clean = (v) => String(v ?? "").trim().slice(0, 1500);

function makeMessage(report) {
  const p = JSON.parse(report.payload);
  const lines = [
    `<b>${labels[report.type] || "تقرير"}</b>`,
    `التاريخ: ${report.report_date}`,
    report.branch ? `الفرع: ${report.branch}` : "",
    ...Object.entries(p).map(([k, v]) => `${k}: ${String(v)}`)
  ].filter(Boolean);
  return lines.join("\n");
}
async function sendTelegram(report) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("أكمل إعدادات Telegram في ملف .env");
  const message = makeMessage(report);
  let url = `https://api.telegram.org/bot${token}/sendMessage`;
  let options;
  if (report.file_name) {
    const filePath = path.join(dataDir, "uploads", report.file_name);
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", message.replace(/<[^>]*>/g, "").slice(0, 1000));
    form.append("parse_mode", "HTML");
    form.append("document", new Blob([fs.readFileSync(filePath)]), report.file_name);
    url = `https://api.telegram.org/bot${token}/sendDocument`;
    options = { method: "POST", body: form };
  } else {
    options = { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }) };
  }
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.description || "فشل الإرسال");
}

app.get("/api/reports", (_req, res) => {
  const rows = db.prepare("SELECT * FROM reports ORDER BY id DESC LIMIT 100").all();
  res.json(rows.map(r => ({ ...r, payload: JSON.parse(r.payload) })));
});
app.post("/api/reports", upload.single("attachment"), async (req, res) => {
  try {
    const type = clean(req.body.type);
    if (!labels[type]) return res.status(400).json({ error: "نوع التقرير غير صحيح" });
    const payload = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (!["type", "branch", "report_date"].includes(key)) payload[clean(key)] = clean(value);
    }
    const date = clean(req.body.report_date) || new Date().toISOString().slice(0, 10);
    const result = db.prepare(`INSERT INTO reports
      (type, branch, report_date, payload, file_name, created_at, telegram_status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')`).run(
        type, clean(req.body.branch), date, JSON.stringify(payload),
        req.file?.filename || null, new Date().toISOString()
      );
    const report = db.prepare("SELECT * FROM reports WHERE id=?").get(result.lastInsertRowid);
    let status = "sent";
    let error = null;
    try { await sendTelegram(report); }
    catch (e) { status = "failed"; error = e.message; }
    db.prepare("UPDATE reports SET telegram_status=? WHERE id=?").run(status, report.id);
    res.json({ ok: true, id: report.id, telegram_status: status, telegram_error: error });
  } catch (e) {
    if (req.file) fs.rmSync(req.file.path, { force: true });
    res.status(400).json({ error: e.message || "تعذر حفظ التقرير" });
  }
});
app.post("/api/reports/:id/resend", async (req, res) => {
  const report = db.prepare("SELECT * FROM reports WHERE id=?").get(Number(req.params.id));
  if (!report) return res.status(404).json({ error: "التقرير غير موجود" });
  try {
    await sendTelegram(report);
    db.prepare("UPDATE reports SET telegram_status='sent' WHERE id=?").run(report.id);
    res.json({ ok: true });
  } catch (e) {
    db.prepare("UPDATE reports SET telegram_status='failed' WHERE id=?").run(report.id);
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/telegram-test", async (_req, res) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new Error("أكمل إعدادات Telegram في .env");
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "تم الاتصال بنظام التقارير بنجاح ✅" })
    });
    const data = await r.json();
    if (!r.ok || !data.ok) throw new Error(data.description || "فشل الاختبار");
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.listen(port, () => console.log(`RASD running at http://localhost:${port}`));
