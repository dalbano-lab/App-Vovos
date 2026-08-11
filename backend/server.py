from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid, json, os, httpx, aiosqlite, logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

DB_PATH = Path(__file__).parent / "doctorvovo.db"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="DoctorVovô API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── DB ────────────────────────────────────────────────────────────────────────
async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""CREATE TABLE IF NOT EXISTS profile (
            id TEXT PRIMARY KEY, full_name TEXT NOT NULL, called_as TEXT NOT NULL,
            photo_base64 TEXT, emergency_phone TEXT, emergency_name TEXT,
            font_scale REAL DEFAULT 1.0, high_contrast INTEGER DEFAULT 0, created_at TEXT)""")
        await db.execute("""CREATE TABLE IF NOT EXISTS medications (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, dosage TEXT, instructions TEXT,
            times TEXT DEFAULT '[]', photo_base64 TEXT, caregiver_audio_base64 TEXT, created_at TEXT)""")
        await db.execute("""CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL,
            location TEXT, notes TEXT, completed INTEGER DEFAULT 0, created_at TEXT)""")
        await db.execute("""CREATE TABLE IF NOT EXISTS family_messages (
            id TEXT PRIMARY KEY, sender TEXT NOT NULL, text TEXT NOT NULL,
            audio_base64 TEXT, created_at TEXT)""")
        await db.commit()

@app.on_event("startup")
async def startup():
    await init_db()

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# ─── MODELS ────────────────────────────────────────────────────────────────────
class ProfileCreate(BaseModel):
    full_name: str
    called_as: str
    photo_base64: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_name: Optional[str] = None
    font_scale: Optional[float] = 1.0
    high_contrast: Optional[bool] = False

class MedicationCreate(BaseModel):
    name: str
    dosage: Optional[str] = None
    instructions: Optional[str] = None
    times: List[str] = []
    photo_base64: Optional[str] = None
    caregiver_audio_base64: Optional[str] = None

class AppointmentCreate(BaseModel):
    title: str
    date: str
    time: str
    location: Optional[str] = None
    notes: Optional[str] = None

class FamilyMessageCreate(BaseModel):
    sender: str
    text: str
    audio_base64: Optional[str] = None

class IdentifyRequest(BaseModel):
    image_base64: str

# ─── PROFILE ───────────────────────────────────────────────────────────────────
@app.get("/api/profile")
async def get_profile():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM profile LIMIT 1") as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

@app.put("/api/profile")
async def upsert_profile(data: ProfileCreate):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id FROM profile LIMIT 1") as cur:
            row = await cur.fetchone()
        if row:
            await db.execute(
                "UPDATE profile SET full_name=?,called_as=?,photo_base64=?,emergency_phone=?,emergency_name=?,font_scale=?,high_contrast=? WHERE id=?",
                (data.full_name, data.called_as, data.photo_base64, data.emergency_phone,
                 data.emergency_name, data.font_scale, int(data.high_contrast or False), row[0]))
        else:
            await db.execute(
                "INSERT INTO profile(id,full_name,called_as,photo_base64,emergency_phone,emergency_name,font_scale,high_contrast,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), data.full_name, data.called_as, data.photo_base64,
                 data.emergency_phone, data.emergency_name, data.font_scale,
                 int(data.high_contrast or False), now_iso()))
        await db.commit()
    return await get_profile()

@app.delete("/api/profile")
async def delete_all():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM profile")
        await db.execute("DELETE FROM medications")
        await db.execute("DELETE FROM appointments")
        await db.execute("DELETE FROM family_messages")
        await db.commit()
    return {"ok": True}

# ─── MEDICATIONS ───────────────────────────────────────────────────────────────
@app.get("/api/medications")
async def list_medications():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM medications ORDER BY created_at") as cur:
            rows = await cur.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["times"] = json.loads(d.get("times") or "[]")
        result.append(d)
    return result

@app.post("/api/medications")
async def add_medication(data: MedicationCreate):
    mid = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO medications(id,name,dosage,instructions,times,photo_base64,caregiver_audio_base64,created_at) VALUES(?,?,?,?,?,?,?,?)",
            (mid, data.name, data.dosage, data.instructions, json.dumps(data.times),
             data.photo_base64, data.caregiver_audio_base64, now_iso()))
        await db.commit()
    return {"id": mid, "name": data.name, "dosage": data.dosage,
            "instructions": data.instructions, "times": data.times}

@app.delete("/api/medications/{med_id}")
async def delete_medication(med_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM medications WHERE id=?", (med_id,))
        await db.commit()
    return {"ok": True}

@app.post("/api/medications/identify")
async def identify_medication(req: IdentifyRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY não configurada")
    b64 = req.image_base64
    if "," in b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 512,
        "messages": [{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}},
            {"type": "text", "text": (
                "Identifique o medicamento nesta imagem. Responda SOMENTE em JSON válido com: "
                "name (nome do remédio ou 'Desconhecido'), dosage (dosagem ou null), "
                "instructions (instrução resumida em português, máx 80 chars), "
                "suggested_times (array de horários HH:MM, ex: ['08:00','20:00']), "
                "confidence (baixa|media|alta). Sem texto adicional."
            )}
        ]}]
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json=payload)
        resp.raise_for_status()
        text = resp.json()["content"][0]["text"].strip()
        if text.startswith("```"):
            text = text.strip("`").lstrip("json").strip()
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            text = text[start:end+1]
        data = json.loads(text)
    except Exception as e:
        logger.warning(f"identify error: {e}")
        data = {"name": "Desconhecido", "dosage": None, "instructions": None, "suggested_times": [], "confidence": "baixa"}
    data.setdefault("name", "Desconhecido")
    data.setdefault("dosage", None)
    data.setdefault("instructions", None)
    data.setdefault("suggested_times", [])
    data.setdefault("confidence", "baixa")
    return data

# ─── APPOINTMENTS ──────────────────────────────────────────────────────────────
@app.get("/api/appointments")
async def list_appointments():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM appointments ORDER BY date, time") as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]

@app.post("/api/appointments")
async def add_appointment(data: AppointmentCreate):
    aid = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO appointments(id,title,date,time,location,notes,completed,created_at) VALUES(?,?,?,?,?,?,0,?)",
            (aid, data.title, data.date, data.time, data.location, data.notes, now_iso()))
        await db.commit()
    return {"id": aid, "title": data.title, "date": data.date, "time": data.time,
            "location": data.location, "notes": data.notes, "completed": False}

@app.delete("/api/appointments/{apt_id}")
async def delete_appointment(apt_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM appointments WHERE id=?", (apt_id,))
        await db.commit()
    return {"ok": True}

@app.put("/api/appointments/{apt_id}/complete")
async def complete_appointment(apt_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE appointments SET completed=1 WHERE id=?", (apt_id,))
        await db.commit()
    return {"ok": True}

# ─── FAMILY MESSAGES ───────────────────────────────────────────────────────────
@app.get("/api/family-messages")
async def list_family_messages():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM family_messages ORDER BY created_at DESC") as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]

@app.post("/api/family-messages")
async def add_family_message(data: FamilyMessageCreate):
    mid = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO family_messages(id,sender,text,audio_base64,created_at) VALUES(?,?,?,?,?)",
            (mid, data.sender, data.text, data.audio_base64, now_iso()))
        await db.commit()
    return {"id": mid, "sender": data.sender, "text": data.text,
            "audio_base64": data.audio_base64, "created_at": now_iso()}

@app.delete("/api/family-messages/{msg_id}")
async def delete_family_message(msg_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM family_messages WHERE id=?", (msg_id,))
        await db.commit()
    return {"ok": True}

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "DoctorVovô", "version": "1.0.0"}
