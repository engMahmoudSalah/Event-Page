import { BaseHub, makeWorker, bad, clean, rid, now, isEmail } from "./core.js";

const LIMITS = { free: { events: 2, tickets: 200 }, pro: { events: 20, tickets: 5000 } };
const T0 = Date.UTC(2027, 2, 18, 7, 0); // 18 Mar 2027 09:00 Cairo
const H = 3600e3;
const SEED_SPEAKERS = [["Dr. Nadia Farouk", "Chief AI Scientist", "Nile Labs"], ["Karim Adel", "CTO", "Delta Cloud"], ["Mona Said", "Head of Product", "Orbit Health"], ["Omar Lotfy", "ML Engineer", "Cairo Robotics"], ["Salma Nabil", "Policy Lead", "Digital Egypt Council"], ["Hassan Reda", "Founder", "Sahl AI"]];
const SEED_SESSIONS = [
  ["Doors open and registration", "Pick up your badge and meet other attendees.", "", "Lobby", 0, 1],
  ["Opening keynote: AI that ships", "Where applied AI is actually working in 2027, and what is still hype.", 0, "Main hall", 1, 1],
  ["Building with small models", "How teams cut cost and latency by choosing the right model size.", 3, "Main hall", 2.5, 1],
  ["Lunch and demos", "Hands-on demo tables from sponsors and community projects.", "", "Expo floor", 4, 1.5],
  ["AI in healthcare: lessons so far", "A product view on safety, review loops and trust.", 2, "Room B", 5.5, 1],
  ["Responsible AI and policy", "What regulation means for builders in the region.", 4, "Main hall", 6.5, 1],
  ["Founders panel: from prototype to product", "Three founders share what broke between demo day and launch.", 5, "Main hall", 7.5, 1.25],
  ["Closing and networking", "Wrap-up, raffle and open networking.", "", "Lobby", 9, 1.5],
];
export class Hub extends BaseHub {
  adminHash() { return "3954f4c578cae100a111e4a8e3f3a02ed85d1f71944dacd76fb23b0eea2779e0"; }
  schemaSQL() {
    return `CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, owner TEXT NOT NULL, title TEXT NOT NULL, tagline TEXT NOT NULL DEFAULT '', descr TEXT NOT NULL DEFAULT '', venue TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', starts INTEGER NOT NULL, ends INTEGER NOT NULL, capacity INTEGER NOT NULL DEFAULT 100, status TEXT NOT NULL DEFAULT 'pending', reason TEXT NOT NULL DEFAULT '', sample INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tiers(id TEXT PRIMARY KEY, event TEXT NOT NULL, name TEXT NOT NULL, descr TEXT NOT NULL DEFAULT '', price INTEGER NOT NULL DEFAULT 0, qty INTEGER NOT NULL DEFAULT 0, pos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS speakers(id TEXT PRIMARY KEY, event TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', org TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', pos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS slots(id TEXT PRIMARY KEY, event TEXT NOT NULL, title TEXT NOT NULL, descr TEXT NOT NULL DEFAULT '', speaker TEXT NOT NULL DEFAULT '', room TEXT NOT NULL DEFAULT '', starts INTEGER NOT NULL, ends INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tickets(code TEXT PRIMARY KEY, event TEXT NOT NULL, tier TEXT NOT NULL, uid TEXT, name TEXT NOT NULL, email TEXT NOT NULL, created INTEGER NOT NULL, checked INTEGER, UNIQUE(event,email));
CREATE INDEX IF NOT EXISTS ev_status ON events(status,starts)`;
  }
  seed() {
    if (this._sd) return; this._sd = true;
    const ex = this.one("SELECT id FROM events WHERE slug='ai-summit-2027'");
    if (ex) { if (!this.one("SELECT 1 x FROM slots WHERE event=?", ex.id)) this.seedSlots(ex.id); return; }
    const id = "e" + rid(5); const t = now();
    this.run("INSERT INTO events(id,slug,owner,title,tagline,descr,venue,city,starts,ends,capacity,status,sample,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,'approved',1,?,?)", id, "ai-summit-2027", "system", "AI Summit 2027", "One day on applied AI: models, products and policy.", "A one-day conference for builders, founders and curious people. Talks on shipping AI products, small models, healthcare, policy and what comes next. This is a sample event that shows how the platform works; the dates, speakers and sessions are made up.", "Grand Conference Hall", "Cairo", T0, T0 + 10.5 * H, 500, t, t);
    [["Open access", "Talks, expo floor and networking. Free.", 0, 400], ["Pro pass", "Workshops and speaker lounge.", 150, 80], ["Team pack", "Five Pro passes and a sponsor listing.", 500, 20]].forEach((x, i) => this.run("INSERT INTO tiers(id,event,name,descr,price,qty,pos) VALUES(?,?,?,?,?,?,?)", "t" + rid(4), id, x[0], x[1], x[2], x[3], i));
    SEED_SPEAKERS.forEach((s, i) => this.run("INSERT INTO speakers(id,event,name,role,org,pos) VALUES(?,?,?,?,?,?)", "p" + rid(4), id, s[0], s[1], s[2], i));
    this.seedSlots(id);
  }
  seedSlots(id) {
    SEED_SESSIONS.forEach((s) => this.run("INSERT INTO slots(id,event,title,descr,speaker,room,starts,ends) VALUES(?,?,?,?,?,?,?,?)", "s" + rid(4), id, s[0], s[1], s[2] === "" ? "" : SEED_SPEAKERS[s[2]][0], s[3], T0 + s[4] * H, T0 + (s[4] + s[5]) * H));
  }
  purgeUsers(ids) {
    const n = ids.map(() => "?").join(","); const E = `SELECT id FROM events WHERE owner IN (${n})`;
    for (const t of ["tiers", "speakers", "slots", "tickets"]) this.run(`DELETE FROM ${t} WHERE event IN (${E})`, ...ids);
    this.run(`DELETE FROM events WHERE owner IN (${n})`, ...ids);
    this.run(`DELETE FROM tickets WHERE uid IN (${n}) OR email LIKE '%@example.com'`, ...ids);
  }
  lim(u) { return LIMITS[u.plan] || LIMITS.free; }
  adminStats() { return { events: this.one("SELECT COUNT(*) n FROM events WHERE sample=0").n, pending: this.one("SELECT COUNT(*) n FROM events WHERE status='pending'").n, tickets: this.one("SELECT COUNT(*) n FROM tickets t JOIN events e ON e.id=t.event WHERE e.sample=0").n, checked: this.one("SELECT COUNT(*) n FROM tickets WHERE checked IS NOT NULL").n }; }
  counts(id) {
    const rows = this.q("SELECT tier, COUNT(*) n, SUM(CASE WHEN checked IS NOT NULL THEN 1 ELSE 0 END) c FROM tickets WHERE event=? GROUP BY tier", id);
    const by = {}; let total = 0, checked = 0; for (const r of rows) { by[r.tier] = r.n; total += r.n; checked += r.c || 0; } return { by, total, checked };
  }
  evOut(e, full) {
    const cn = this.counts(e.id);
    const o = { id: e.id, slug: e.slug, title: e.title, tagline: e.tagline, venue: e.venue, city: e.city, starts: e.starts, ends: e.ends, capacity: e.capacity, status: e.status, sample: !!e.sample, registered: cn.total };
    if (full) {
      o.descr = e.descr; o.reason = e.reason; o.owner = e.owner; o.checked = cn.checked;
      o.tiers = this.q("SELECT * FROM tiers WHERE event=? ORDER BY pos", e.id).map((t) => ({ id: t.id, name: t.name, descr: t.descr, price: t.price, qty: t.qty, taken: cn.by[t.id] || 0 }));
      o.speakers = this.q("SELECT * FROM speakers WHERE event=? ORDER BY pos", e.id).map((s) => ({ id: s.id, name: s.name, role: s.role, org: s.org, bio: s.bio }));
      o.sessions = this.q("SELECT * FROM slots WHERE event=? ORDER BY starts, ends", e.id).map((s) => ({ id: s.id, title: s.title, descr: s.descr, speaker: s.speaker, room: s.room, starts: s.starts, ends: s.ends }));
    }
    return o;
  }
  slug(title) { const b = String(title).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "event"; return b + "-" + rid(3); }
  saveEvent(id, b, old) {
    const num = (v, d, max) => { const x = v === undefined || v === "" ? d : Number(v); if (!Number.isFinite(x) || x < 0 || x > max) bad("Check the numbers you entered."); return Math.round(x); };
    const title = clean(b.title, 100); if (title.length < 4) bad("Give the event a title (at least 4 characters).");
    const starts = Number(b.starts), ends = Number(b.ends);
    if (!Number.isFinite(starts) || !Number.isFinite(ends) || starts < 946684800000) bad("Pick a start date and time.");
    if (ends <= starts) bad("The end must be after the start.");
    if (ends - starts > 14 * 864e5) bad("An event can run for at most 14 days.");
    const cap = num(b.capacity, 100, 100000); if (cap < 1) bad("Capacity must be at least 1.");
    const tiers = (Array.isArray(b.tiers) ? b.tiers : []).slice(0, 6).map((t) => ({ id: t.id, name: clean(t.name, 40), descr: clean(t.descr, 160), price: num(t.price, 0, 100000), qty: num(t.qty, cap, 100000) })).filter((t) => t.name);
    if (!tiers.length) bad("Add at least one ticket type.");
    const speakers = (Array.isArray(b.speakers) ? b.speakers : []).slice(0, 30).map((s) => ({ name: clean(s.name, 60), role: clean(s.role, 60), org: clean(s.org, 60), bio: clean(s.bio, 400) })).filter((s) => s.name);
    const sessions = (Array.isArray(b.sessions) ? b.sessions : []).slice(0, 60).map((s) => ({ title: clean(s.title, 100), descr: clean(s.descr, 400), speaker: clean(s.speaker, 60), room: clean(s.room, 40), starts: Number(s.starts), ends: Number(s.ends) })).filter((s) => s.title);
    for (const s of sessions) { if (!Number.isFinite(s.starts) || !Number.isFinite(s.ends) || s.ends <= s.starts) bad(`Check the time of the session "${s.title}".`); }
    const f = { title, tagline: clean(b.tagline, 140), descr: clean(b.descr, 4000), venue: clean(b.venue, 100), city: clean(b.city, 60), starts, ends, cap };
    if (old) {
      this.run("UPDATE events SET title=?,tagline=?,descr=?,venue=?,city=?,starts=?,ends=?,capacity=?,updated=? WHERE id=?", f.title, f.tagline, f.descr, f.venue, f.city, f.starts, f.ends, f.cap, now(), id);
    } else this.run("INSERT INTO events(id,slug,owner,title,tagline,descr,venue,city,starts,ends,capacity,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", id, this.slug(title), b._owner, f.title, f.tagline, f.descr, f.venue, f.city, f.starts, f.ends, f.cap, now(), now());
    const keep = new Set(); const existing = new Set(this.q("SELECT id FROM tiers WHERE event=?", id).map((r) => r.id));
    tiers.forEach((t, i) => {
      if (t.id && existing.has(t.id)) { keep.add(t.id); this.run("UPDATE tiers SET name=?,descr=?,price=?,qty=?,pos=? WHERE id=?", t.name, t.descr, t.price, t.qty, i, t.id); }
      else { const k = "t" + rid(4); keep.add(k); this.run("INSERT INTO tiers(id,event,name,descr,price,qty,pos) VALUES(?,?,?,?,?,?,?)", k, id, t.name, t.descr, t.price, t.qty, i); }
    });
    for (const r of this.q("SELECT id FROM tiers WHERE event=?", id)) if (!keep.has(r.id)) { if (this.one("SELECT 1 x FROM tickets WHERE tier=?", r.id)) bad("A ticket type that already has tickets can't be removed. Set its quantity to the number sold instead."); this.run("DELETE FROM tiers WHERE id=?", r.id); }
    this.run("DELETE FROM speakers WHERE event=?", id); speakers.forEach((s, i) => this.run("INSERT INTO speakers(id,event,name,role,org,bio,pos) VALUES(?,?,?,?,?,?,?)", "p" + rid(4), id, s.name, s.role, s.org, s.bio, i));
    this.run("DELETE FROM slots WHERE event=?", id); sessions.forEach((s) => this.run("INSERT INTO slots(id,event,title,descr,speaker,room,starts,ends) VALUES(?,?,?,?,?,?,?,?)", "s" + rid(4), id, s.title, s.descr, s.speaker, s.room, s.starts, s.ends));
  }
  ownEvent(c, ref) {
    const u = this.need(c); const e = this.one("SELECT * FROM events WHERE id=? OR slug=?", ref, ref); if (!e) bad("Event not found.", 404);
    if (e.owner !== u.id && u.role !== "admin") bad("This isn't your event.", 403); return [u, e];
  }
  ticketOut(t) {
    const e = this.one("SELECT * FROM events WHERE id=?", t.event); const tr = this.one("SELECT name,price FROM tiers WHERE id=?", t.tier);
    return { code: t.code, name: t.name, email: t.email, created: t.created, checked: t.checked, tier: tr ? tr.name : "", event: { id: e.id, slug: e.slug, title: e.title, venue: e.venue, city: e.city, starts: e.starts, ends: e.ends, sample: !!e.sample } };
  }
  exportData(u) {
    return { events: this.q("SELECT * FROM events WHERE owner=? LIMIT 500", u.id), tickets: this.q("SELECT code,event,tier,name,email,created,checked FROM tickets WHERE uid=? LIMIT 1000", u.id) };
  }
  async app(c) {
    this.seed();
    const { path, method, body, url } = c; let m;
    if (path === "/api/plans" && method === "GET") return { plans: [
      { id: "free", name: "Free", price: "$0", features: ["2 events", "200 tickets per event", "QR tickets and check-in", "Attendee export (CSV)"] },
      { id: "pro", name: "Pro", price: "$19/month", features: ["20 events", "5,000 tickets per event", "Priority review", "Custom ticket types"] }] };
    if (path === "/api/events" && method === "GET") {
      const g = (k) => url.searchParams.get(k) || ""; const w = ["status='approved'"], a = [];
      if (g("q")) { w.push("(title LIKE ? OR city LIKE ? OR tagline LIKE ?)"); const q = "%" + g("q").slice(0, 40) + "%"; a.push(q, q, q); }
      if (g("when") === "past") { w.push("ends<?"); a.push(now()); } else { w.push("ends>=?"); a.push(now()); }
      const rows = this.q(`SELECT * FROM events WHERE ${w.join(" AND ")} ORDER BY starts ${g("when") === "past" ? "DESC" : "ASC"} LIMIT 60`, ...a);
      return { events: rows.map((e) => this.evOut(e)) };
    }
    if ((m = path.match(/^\/api\/events\/([a-z0-9-]+)$/)) && method === "GET") {
      const e = this.one("SELECT * FROM events WHERE slug=? OR id=?", m[1], m[1]); if (!e) bad("Event not found.", 404);
      const own = c.user && (c.user.id === e.owner || c.user.role === "admin");
      if (e.status !== "approved" && !own) bad("Event not found.", 404);
      return { event: this.evOut(e, true), own: !!own };
    }
    if ((m = path.match(/^\/api\/events\/([a-z0-9]+)\/register$/)) && method === "POST") {
      this.limit("reg:" + c.ip, 12, 3600e3);
      if (body.website) return { ok: true };
      const e = this.one("SELECT * FROM events WHERE id=? AND status='approved'", m[1]); if (!e) bad("Event not found.", 404);
      if (e.ends < now()) bad("This event has ended.");
      const tr = this.one("SELECT * FROM tiers WHERE id=? AND event=?", String(body.tier), e.id); if (!tr) bad("Pick a ticket type.");
      if (tr.price > 0) bad("Paid tickets are not available yet. Pick the free ticket for now.", 402);
      const name = clean(body.name, 60), email = clean(body.email, 120).toLowerCase();
      if (name.length < 2) bad("Enter your name (at least 2 characters)."); if (!isEmail(email)) bad("Enter a valid email address.");
      if (this.one("SELECT 1 x FROM tickets WHERE event=? AND email=?", e.id, email)) bad("This email already has a ticket for this event. Open it from the ticket lookup.", 409);
      const cn = this.counts(e.id);
      if (cn.total >= e.capacity || (cn.by[tr.id] || 0) >= tr.qty) bad("Sorry, this ticket type is sold out.", 409);
      const owner = this.one("SELECT plan FROM users WHERE id=?", e.owner); const cap = e.sample ? 100000 : (LIMITS[owner && owner.plan] || LIMITS.free).tickets;
      if (cn.total >= cap) bad("This event reached its ticket limit on the organizer's plan.", 409);
      const code = "AIS-" + rid(5).toUpperCase();
      this.run("INSERT INTO tickets(code,event,tier,uid,name,email,created) VALUES(?,?,?,?,?,?,?)", code, e.id, tr.id, c.user ? c.user.id : null, name, email, now());
      return { ticket: this.ticketOut(this.one("SELECT * FROM tickets WHERE code=?", code)) };
    }
    if (path === "/api/tickets/lookup" && method === "POST") {
      this.limit("look:" + c.ip, 20, 3600e3);
      const t = this.one("SELECT * FROM tickets WHERE code=?", clean(body.code, 20).toUpperCase());
      if (!t) bad("No ticket found with that code.", 404); return { ticket: this.ticketOut(t) };
    }
    if ((m = path.match(/^\/api\/tickets\/(AIS-[A-Z0-9]+)$/)) && method === "GET") { const t = this.one("SELECT * FROM tickets WHERE code=?", m[1]); if (!t) bad("No ticket found with that code.", 404); return { ticket: this.ticketOut(t) }; }
    const u = this.need(c);
    if ((m = path.match(/^\/api\/tickets\/(AIS-[A-Z0-9]+)\/cancel$/)) && method === "POST") {
      const t = this.one("SELECT * FROM tickets WHERE code=?", m[1]); if (!t) bad("No ticket found.", 404);
      const e = this.one("SELECT owner FROM events WHERE id=?", t.event);
      if (t.uid !== u.id && e.owner !== u.id && u.role !== "admin") bad("This isn't your ticket.", 403);
      if (t.checked) bad("This ticket was already used for check-in.", 409);
      this.run("DELETE FROM tickets WHERE code=?", t.code); return { ok: true };
    }
    if (path === "/api/my/tickets" && method === "GET") return { tickets: this.q("SELECT * FROM tickets WHERE uid=? OR email=? ORDER BY created DESC LIMIT 100", u.id, u.email).map((t) => this.ticketOut(t)) };
    if (path === "/api/my/events" && method === "GET") return { events: this.q("SELECT * FROM events WHERE owner=? ORDER BY created DESC", u.id).map((e) => this.evOut(e)), limit: this.lim(u).events };
    if (path === "/api/events" && method === "POST") {
      if (this.one("SELECT COUNT(*) n FROM events WHERE owner=?", u.id).n >= this.lim(u).events && u.role !== "admin") bad(`Your ${u.plan === "pro" ? "Pro" : "Free"} plan allows ${this.lim(u).events} events. The Pro plan is coming soon.`, 402);
      this.limit("newe:" + u.id, 10, 3600e3);
      const id = "e" + rid(5); this.saveEvent(id, { ...body, _owner: u.id }, null);
      this.audit(u.id, "event_create", body.title); return { id, slug: this.one("SELECT slug FROM events WHERE id=?", id).slug };
    }
    if ((m = path.match(/^\/api\/events\/([a-z0-9-]+)$/))) {
      const [me, e] = this.ownEvent(c, m[1]);
      if (method === "DELETE") { for (const t of ["tiers", "speakers", "slots", "tickets"]) this.run(`DELETE FROM ${t} WHERE event=?`, e.id); this.run("DELETE FROM events WHERE id=?", e.id); this.audit(me.id, "event_delete", e.title); return { ok: true }; }
      if (method === "POST") { this.saveEvent(e.id, body, e); if (me.role !== "admin") this.run("UPDATE events SET status='pending',reason='' WHERE id=?", e.id); return { ok: true, status: me.role === "admin" ? e.status : "pending" }; }
    }
    if ((m = path.match(/^\/api\/events\/([a-z0-9-]+)\/attendees$/)) && method === "GET") {
      const [, e] = this.ownEvent(c, m[1]);
      return { attendees: this.q("SELECT t.code,t.name,t.email,t.created,t.checked,r.name tier FROM tickets t LEFT JOIN tiers r ON r.id=t.tier WHERE t.event=? ORDER BY t.created DESC LIMIT 5000", e.id), event: this.evOut(e, true) };
    }
    if ((m = path.match(/^\/api\/events\/([a-z0-9-]+)\/checkin$/)) && method === "POST") {
      const [me, e] = this.ownEvent(c, m[1]);
      const code = clean(body.code, 20).toUpperCase().replace(/^.*(AIS-[A-Z0-9]+).*$/, "$1");
      const t = this.one("SELECT * FROM tickets WHERE code=? AND event=?", code, e.id);
      if (!t) return { result: "invalid", code };
      const tier = (this.one("SELECT name FROM tiers WHERE id=?", t.tier) || {}).name || "";
      if (body.undo) { this.run("UPDATE tickets SET checked=NULL WHERE code=?", t.code); return { result: "undone", name: t.name, tier, code: t.code }; }
      if (t.checked) return { result: "already", name: t.name, tier, code: t.code, at: t.checked };
      this.run("UPDATE tickets SET checked=? WHERE code=?", now(), t.code); this.audit(me.id, "checkin", t.code);
      return { result: "ok", name: t.name, tier, code: t.code };
    }
    if (path === "/api/admin/pending" && method === "GET") { this.needAdmin(c); return { events: this.q("SELECT e.*,u.name oname,u.email oemail FROM events e LEFT JOIN users u ON u.id=e.owner WHERE e.status='pending' ORDER BY e.created").map((e) => ({ ...this.evOut(e, true), oname: e.oname, oemail: e.oemail })) }; }
    if ((m = path.match(/^\/api\/admin\/event\/([a-z0-9]+)$/)) && method === "POST") {
      const me = this.needAdmin(c); const e = this.one("SELECT * FROM events WHERE id=?", m[1]); if (!e) bad("Event not found.", 404);
      if (!["approved", "rejected"].includes(body.status)) bad("Invalid decision.");
      this.run("UPDATE events SET status=?,reason=? WHERE id=?", body.status, clean(body.reason, 300), e.id); this.audit(me.id, "event_" + body.status, e.title); return { ok: true };
    }
    return null;
  }
}
export default makeWorker("HUB");
