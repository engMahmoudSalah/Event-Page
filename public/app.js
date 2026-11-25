import { $, h, api, siteFooter, byMahmoudView, toast, guard, modal, ago, initTheme, field, authForm, plansView, adminView } from "/kit.js";
import qrcode from "/qrcode.js";
import { canvasEl, reveal, tilt } from "/fx.js";
const toggleTheme = initTheme();
const S = { user: null };
const app = $("#app");
let timer = null;
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
const fD = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
const fT = (t) => new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const fDT = (t) => `${fD(t)}, ${fT(t)}`;
const pad = (n) => String(n).padStart(2, "0");
const toInput = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromInput = (v) => (v ? new Date(v).getTime() : NaN);
const price = (p) => (p > 0 ? `$${p}` : "Free");
const STATUS = { pending: ["In review", "warn"], approved: ["Published", "ok"], rejected: ["Rejected", "bad"] };
const agendaGet = () => { try { return JSON.parse(localStorage.getItem("ais_agenda") || "[]"); } catch { return []; } };
const agendaSet = (a) => localStorage.setItem("ais_agenda", JSON.stringify(a));
const ics = (name, ev, sessions) => {
  const z = (t) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const esc = (s) => String(s || "").replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const rows = sessions.length ? sessions.map((s) => [s.id, s.title, s.starts, s.ends, [s.room, s.speaker].filter(Boolean).join(" / ")]) : [[ev.id, ev.title, ev.starts, ev.ends, ev.venue]];
  const body = rows.map((r) => `BEGIN:VEVENT\r\nUID:${r[0]}@ai-summit\r\nDTSTAMP:${z(Date.now())}\r\nDTSTART:${z(r[2])}\r\nDTEND:${z(r[3])}\r\nSUMMARY:${esc(r[1])}\r\nLOCATION:${esc(r[4] || ev.venue)}\r\nEND:VEVENT`).join("\r\n");
  download(name, "text/calendar", `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AI Summit//EN\r\n${body}\r\nEND:VCALENDAR\r\n`);
};
function download(name, type, text) { const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove(); }
const qrSvg = (text) => { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); };

function shell(content, active) {
  if (timer) { clearInterval(timer); timer = null; }
  const items = [["#/", "Events", "home"], ["#/lookup", "Find ticket", "lookup"]];
  if (S.user) items.push(["#/tickets", "My tickets", "tickets"], ["#/mine", "My events", "mine"]);
  items.push(["#/plans", "Plans", "plans"]); if (S.user && S.user.role === "admin") items.push(["#/admin", "Admin", "admin"]);
  items.push(S.user ? ["#/account", "Account", "account"] : ["#/login", "Log in", "login"]);
  app.replaceChildren(h("header", { class: "topbar" }, h("div", { class: "in" }, h("a", { class: "brand", href: "#/" }, h("span", { class: "lg" }, "✦"), h("span", {}, "AI Summit")), h("nav", { class: "nav", "aria-label": "Main" }, items.map(([href, t, k]) => h("a", { href, class: active === k ? "on" : "" }, t))), h("button", { class: "btn sm", "aria-label": "Toggle dark mode", onclick: toggleTheme }, "◐"))), h("main", {}, content), siteFooter());
}
const evCard = (e) => h("a", { class: "card evcard", href: `#/e/${e.slug}` },
  h("div", { class: "date" }, `${fD(e.starts)} · ${fT(e.starts)}`), h("h3", { style: "margin:0" }, e.title), h("div", { class: "muted" }, e.tagline),
  h("div", { class: "row small muted" }, e.venue ? `📍 ${e.venue}${e.city ? ", " + e.city : ""}` : e.city, h("span", {}, `${e.registered} registered`), e.sample ? h("span", { class: "badge" }, "Sample") : null));

async function home() {
  const grid = h("div", { class: "grid" }); let when = "up", q = "";
  const tabs = h("div", { class: "tabs" });
  const run = async () => {
    tabs.replaceChildren(...[["up", "Upcoming"], ["past", "Past"]].map(([k, t]) => h("a", { href: "javascript:void 0", class: when === k ? "on" : "", onclick: (e) => { e.preventDefault(); when = k; run(); } }, t)));
    let d; try { d = await api(`/api/events?when=${when === "past" ? "past" : "up"}&q=${encodeURIComponent(q)}`); } catch (e) { grid.replaceChildren(h("div", { class: "card empty" }, e.message)); return; }
    grid.replaceChildren(...(d.events.length ? d.events.map((e) => { const c = evCard(e); c.classList.add("reveal"); tilt(c); return c; }) : [h("div", { class: "card empty", style: "grid-column:1/-1" }, "No events match. Try another search, or create your own.")])); reveal(grid);
  };
  const search = h("input", { type: "search", placeholder: "Search by name or city", "aria-label": "Search events", style: "max-width:420px", oninput: (e) => { q = e.target.value; clearTimeout(search._t); search._t = setTimeout(run, 250); } });
  shell(h("div", { class: "stack" }, h("section", { class: "hero2 stack fxwrap", style: "align-items:center" }, h("div", { class: "fxbg" }, canvasEl("p")), h("div", { class: "fxart floaty" }, canvasEl("wire", "ico")), h("h1", {}, "Run your event. Fill the room."), h("p", { class: "muted", style: "max-width:560px;margin:0" }, "Publish an event with an agenda and speakers, hand out free QR tickets and check people in at the door. Attendees can build their own agenda and add it to their calendar."),
    h("div", { class: "row", style: "justify-content:center" }, h("a", { class: "btn pri", href: "#/new" }, "Create an event"), h("a", { class: "btn", href: "#/lookup" }, "I have a ticket"))),
    h("div", { class: "row spread" }, tabs, search), grid), "home");
  run();
}
function countdown(ms) {
  const box = h("div", { class: "cd", "aria-label": "Countdown" });
  const upd = () => {
    let s = Math.max(0, Math.floor((ms - Date.now()) / 1000)); const parts = [["days", Math.floor(s / 86400)], ["hours", Math.floor(s / 3600) % 24], ["min", Math.floor(s / 60) % 60], ["sec", s % 60]];
    box.replaceChildren(...parts.map(([l, v]) => h("div", {}, h("b", {}, pad(v)), h("span", {}, l))));
  };
  upd(); timer = setInterval(upd, 1000); return box;
}
async function eventPage(slug) {
  const d = await api(`/api/events/${slug}`); const e = d.event; document.title = `${e.title} · AI Summit`;
  const mine = new Set(agendaGet()); const ended = e.ends < Date.now(); const started = e.starts <= Date.now();
  const sessWrap = h("div", { class: "stack" });
  const sessCard = (s) => h("div", { class: "card sess reveal" },
    h("div", { class: "tm" }, `${fT(s.starts)} – ${fT(s.ends)}`),
    h("div", {}, h("b", {}, s.title), s.descr ? h("div", { class: "muted small" }, s.descr) : null, h("div", { class: "small muted" }, [s.speaker, s.room].filter(Boolean).join(" · "))),
    h("button", { class: "star" + (mine.has(s.id) ? " on" : ""), "aria-pressed": String(mine.has(s.id)), "aria-label": (mine.has(s.id) ? "Remove from my agenda: " : "Add to my agenda: ") + s.title, title: "My agenda", onclick: () => { if (mine.has(s.id)) mine.delete(s.id); else mine.add(s.id); agendaSet([...mine]); renderSess(); renderMine(); } }, mine.has(s.id) ? "★" : "☆"));
  const renderSess = () => {
    const byDay = {}; e.sessions.forEach((s) => (byDay[fD(s.starts)] ||= []).push(s));
    if (!e.sessions.length) return sessWrap.replaceChildren(h("div", { class: "card empty" }, "The agenda hasn't been published yet."));
    sessWrap.replaceChildren(...Object.entries(byDay).map(([day, list]) => h("div", { class: "stack" }, h("h3", { style: "margin:8px 0 0" }, day), list.map(sessCard)))); sessWrap.querySelectorAll(".reveal").forEach((x) => x.classList.add("in"));
  };
  const mineBar = h("div", { class: "card row spread" });
  const renderMine = () => { const n = e.sessions.filter((s) => mine.has(s.id)).length; mineBar.replaceChildren(h("div", {}, h("b", {}, `My agenda: ${n} session${n === 1 ? "" : "s"}`), h("div", { class: "small muted" }, "Tap ☆ on a session to add it. Saved on this device.")), h("button", { class: "btn sm", disabled: !n, onclick: () => ics(`${e.slug}-my-agenda.ics`, e, e.sessions.filter((s) => mine.has(s.id))) }, "Download .ics")); };
  const owner = d.own ? h("div", { class: "card row spread noprint" }, h("div", { class: "row" }, h("span", { class: "badge " + STATUS[e.status][1] }, STATUS[e.status][0]), e.reason ? h("span", { class: "err small" }, `Reason: ${e.reason}`) : null, e.status === "pending" ? h("span", { class: "small muted" }, "Only you can see this page until an admin approves it.") : null),
    h("div", { class: "row" }, h("a", { class: "btn sm", href: `#/checkin/${e.id}` }, "Check-in"), h("a", { class: "btn sm", href: `#/edit/${e.id}` }, "Edit"))) : null;
  const regBox = h("div", { class: "card stack", id: "tickets" }, h("h2", { style: "margin:0" }, "Tickets"));
  e.tiers.forEach((t) => {
    const left = Math.max(0, Math.min(t.qty - t.taken, e.capacity - e.registered)); const paid = t.price > 0;
    regBox.append(h("div", { class: "card tier stack", style: "box-shadow:none" }, h("div", { class: "row spread" }, h("b", {}, t.name), h("span", { class: "price" }, price(t.price))), t.descr ? h("div", { class: "muted small" }, t.descr) : null,
      h("div", { class: "small muted" }, paid ? "Paid tickets are not open yet." : left ? `${left} left` : "Sold out"),
      h("button", { class: "btn" + (paid ? "" : " pri"), disabled: paid || !left || ended, title: paid ? "Payments are not active yet" : "", onclick: () => regForm(e, t) }, paid ? "Coming soon" : ended ? "Event ended" : left ? "Get free ticket" : "Sold out")));
  });
  const speakers = e.speakers.length ? h("section", { class: "stack" }, h("h2", { style: "margin:0" }, "Speakers"), h("div", { class: "grid" }, e.speakers.map((s) => h("div", { class: "card sp" }, h("div", { class: "av", "aria-hidden": "true" }, s.name.split(/\s+/).filter((w) => /^[A-Za-z\u0600-\u06FF]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"), h("div", {}, h("b", {}, s.name), h("div", { class: "muted small" }, [s.role, s.org].filter(Boolean).join(", ")), s.bio ? h("div", { class: "small", style: "margin-top:4px" }, s.bio) : null))))) : null;
  shell(h("div", { class: "stack" }, owner, h("section", { class: "evhero fxwrap" }, h("div", { class: "fxbg" }, canvasEl("p")), h("div", { class: "small", style: "opacity:.85" }, e.sample ? "SAMPLE EVENT" : "EVENT"), h("h1", {}, e.title), h("div", {}, e.tagline), h("div", { style: "margin-top:10px;font-weight:600" }, `${fDT(e.starts)} → ${fD(e.starts) === fD(e.ends) ? fT(e.ends) : fDT(e.ends)}`), h("div", { class: "small", style: "opacity:.85" }, `${[e.venue, e.city].filter(Boolean).join(", ")}${TZ ? " · times in " + TZ : ""}`),
    started ? h("div", { style: "margin-top:12px;font-weight:700" }, ended ? "This event has ended." : "Happening now") : countdown(e.starts),
    h("div", { class: "row", style: "margin-top:14px" }, ended ? null : h("a", { class: "btn", href: "javascript:void 0", style: "background:#fff;color:#2e1065;border-color:#fff", onclick: (ev) => { ev.preventDefault(); $("#tickets").scrollIntoView({ behavior: "smooth" }); } }, "Get tickets"), h("button", { class: "btn", style: "background:transparent;color:inherit;border-color:rgba(255,255,255,.7)", onclick: () => ics(`${e.slug}.ics`, e, []) }, "Add to calendar"))),
    h("div", { class: "two" }, h("div", { class: "stack" }, e.descr ? h("section", { class: "card" }, h("h2", {}, "About"), h("p", { style: "white-space:pre-wrap;margin:0" }, e.descr)) : null, h("h2", { style: "margin:6px 0 0" }, "Agenda"), mineBar, sessWrap, speakers), h("div", { class: "stack", style: "align-self:start" }, regBox, h("p", { class: "small muted" }, `${e.registered} of ${e.capacity} places taken.`)))), "home");
  renderSess(); renderMine();
}
function regForm(e, t) {
  const name = h("input", { value: S.user ? S.user.name : "", maxlength: 60, autocomplete: "name" }), email = h("input", { type: "email", value: S.user ? S.user.email : "", maxlength: 120, autocomplete: "email" });
  const hp = h("input", { class: "hp", name: "website", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" });
  const btn = h("button", { class: "btn pri", type: "submit" }, "Get my ticket");
  const m = modal(`${t.name}: ${e.title}`, h("form", { class: "stack", onsubmit: (ev) => { ev.preventDefault(); guard(async () => { const d = await api(`/api/events/${e.id}/register`, { tier: t.id, name: name.value, email: email.value, website: hp.value }); m.close(); toast("Ticket ready"); location.hash = `#/t/${d.ticket.code}`; }, btn); } }, field("Your name", name), field("Email", email, "Used only to check you in. Free ticket, no payment."), hp, btn));
}
async function ticketPage(code) {
  const d = await api(`/api/tickets/${code}`); const t = d.ticket; const e = t.event; document.title = `Ticket ${t.code}`;
  const url = `${location.origin}/#/t/${t.code}`;
  shell(h("div", { class: "stack" }, h("a", { class: "btn sm noprint", href: `#/e/${e.slug}`, style: "align-self:flex-start" }, "← Event page"),
    h("div", { class: "card ticket stack" }, h("div", { class: "small muted" }, "ADMIT ONE"), h("h2", { style: "margin:0" }, e.title), h("div", { class: "muted" }, `${fDT(e.starts)}${e.venue ? " · " + e.venue : ""}`),
      h("div", {}, h("span", { class: "qr", role: "img", "aria-label": `QR code for ticket ${t.code}`, html: qrSvg(url) })), h("div", { class: "code" }, t.code),
      h("div", {}, h("b", {}, t.name), h("div", { class: "muted small" }, `${t.tier} · ${t.email}`)),
      t.checked ? h("span", { class: "badge ok", style: "align-self:center" }, `Checked in ${ago(t.checked)}`) : h("span", { class: "badge", style: "align-self:center" }, "Not checked in yet"),
      h("div", { class: "row noprint", style: "justify-content:center" }, h("button", { class: "btn sm", onclick: () => print() }, "Print"), h("button", { class: "btn sm", onclick: () => download(`ticket-${t.code}.svg`, "image/svg+xml", qrSvg(url).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')) }, "Save QR (SVG)"), h("button", { class: "btn sm", onclick: () => ics(`${e.slug}.ics`, { ...e, id: e.id }, []) }, "Add to calendar"),
        !t.checked ? h("button", { class: "btn sm", onclick: () => { if (!S.user) { toast("Log in with the account that owns this ticket to cancel it.", true); return; } if (confirm("Cancel this ticket?")) guard(async () => { await api(`/api/tickets/${t.code}/cancel`, {}); toast("Ticket cancelled"); location.hash = "#/tickets"; }); } }, "Cancel ticket") : null)),
    h("p", { class: "small muted noprint", style: "text-align:center" }, "Keep this page or the code. Show the QR at the door.")), "tickets");
}
function lookup() {
  const code = h("input", { placeholder: "AIS-XXXXXXXXXX", autocapitalize: "characters", maxlength: 20 });
  shell(h("div", { class: "stack", style: "max-width:460px;margin:0 auto" }, h("h1", {}, "Find your ticket"), h("form", { class: "card stack", onsubmit: (ev) => { ev.preventDefault(); guard(async () => { const d = await api("/api/tickets/lookup", { code: code.value }); location.hash = `#/t/${d.ticket.code}`; }); } }, field("Ticket code", code, "The code is printed under the QR on your ticket."), h("button", { class: "btn pri" }, "Open ticket"))), "lookup");
}
async function myTickets() {
  const d = await api("/api/my/tickets");
  shell(h("div", { class: "stack" }, h("h1", {}, "My tickets"), d.tickets.length ? h("div", { class: "grid" }, d.tickets.map((t) => h("a", { class: "card evcard", href: `#/t/${t.code}` }, h("div", { class: "date" }, fDT(t.event.starts)), h("b", {}, t.event.title), h("div", { class: "code small" }, t.code), h("div", { class: "muted small" }, `${t.tier}${t.checked ? " · checked in" : ""}`)))) : h("div", { class: "card empty" }, "No tickets yet. Browse events and grab a free ticket.", h("div", {}, h("a", { class: "btn pri", href: "#/" }, "Browse events")))), "tickets");
}
async function myEvents() {
  const d = await api("/api/my/events");
  shell(h("div", { class: "stack" }, h("div", { class: "row spread" }, h("div", {}, h("h1", { style: "margin:0" }, "My events"), h("div", { class: "muted small" }, `${d.events.length} of ${d.limit} used on your plan`)), h("a", { class: "btn pri", href: "#/new" }, "Create an event")),
    d.events.length ? d.events.map((e) => h("div", { class: "card row spread" }, h("div", { class: "grow" }, h("a", { href: `#/e/${e.slug}`, style: "font-weight:700" }, e.title), h("div", { class: "muted small" }, `${fDT(e.starts)} · ${e.registered}/${e.capacity} registered`)),
      h("span", { class: "badge " + STATUS[e.status][1] }, STATUS[e.status][0]), h("a", { class: "btn sm", href: `#/checkin/${e.id}` }, "Check-in"), h("a", { class: "btn sm", href: `#/edit/${e.id}` }, "Edit"),
      h("button", { class: "btn sm", onclick: () => { if (confirm(`Delete "${e.title}" and all its tickets?`)) guard(async () => { await api(`/api/events/${e.id}`, null, "DELETE"); toast("Event deleted"); myEvents(); }); } }, "Delete"))) : h("div", { class: "card empty" }, "You haven't created an event yet.")), "mine");
}
async function editor(id) {
  let ev = { title: "", tagline: "", descr: "", venue: "", city: "", starts: Date.now() + 14 * 864e5, ends: Date.now() + 14 * 864e5 + 6 * 36e5, capacity: 100, tiers: [{ name: "General admission", descr: "Free entry", price: 0, qty: 100 }], speakers: [], sessions: [] };
  if (id) { ev = (await api(`/api/events/${id}`)).event; }
  const inp = (k, label, o = {}) => field(label, h(o.area ? "textarea" : "input", { value: ev[k] ?? "", maxlength: o.max || 140, rows: o.area ? 5 : null, oninput: (e) => (ev[k] = e.target.value) }), o.hint);
  const dt = (k, label) => field(label, h("input", { type: "datetime-local", value: toInput(ev[k]), onchange: (e) => (ev[k] = fromInput(e.target.value)) }));
  const lists = h("div", { class: "stack" });
  const rep = (key, title, blank, cols) => {
    const box = h("div", { class: "stack" }), draw = () => box.replaceChildren(...ev[key].map((row, i) => h("div", { class: "rep" }, cols.map(([k, label, type]) => field(label, h(type === "area" ? "textarea" : "input", { type: type === "dt" ? "datetime-local" : type === "num" ? "number" : "text", rows: type === "area" ? 2 : null, min: type === "num" ? 0 : null, value: type === "dt" ? toInput(row[k]) : row[k] ?? "", oninput: type === "dt" ? null : (e) => (row[k] = type === "num" ? e.target.value : e.target.value), onchange: type === "dt" ? (e) => (row[k] = fromInput(e.target.value)) : null }))), h("button", { type: "button", class: "btn sm", style: "align-self:end", onclick: () => { ev[key].splice(i, 1); draw(); } }, "Remove"))));
    draw(); return h("section", { class: "card stack" }, h("div", { class: "row spread" }, h("h3", { style: "margin:0" }, title), h("button", { type: "button", class: "btn sm", onclick: () => { ev[key].push(blank()); draw(); } }, "+ Add")), box);
  };
  lists.append(rep("tiers", "Ticket types", () => ({ name: "", descr: "", price: 0, qty: ev.capacity }), [["name", "Name"], ["descr", "Description"], ["price", "Price (USD, 0 = free)", "num"], ["qty", "Quantity", "num"]]),
    rep("speakers", "Speakers", () => ({ name: "", role: "", org: "", bio: "" }), [["name", "Name"], ["role", "Role"], ["org", "Organization"], ["bio", "Short bio"]]),
    rep("sessions", "Agenda sessions", () => ({ title: "", descr: "", speaker: "", room: "", starts: ev.starts, ends: ev.starts + 36e5 }), [["title", "Title"], ["starts", "Starts", "dt"], ["ends", "Ends", "dt"], ["speaker", "Speaker"], ["room", "Room"], ["descr", "Description"]]));
  const btn = h("button", { class: "btn pri", type: "submit" }, id ? "Save changes" : "Submit for review");
  shell(h("form", { class: "stack", style: "max-width:820px", onsubmit: (e) => { e.preventDefault(); guard(async () => { const r = await api(id ? `/api/events/${id}` : "/api/events", ev); toast(id ? "Saved" : "Submitted for review"); location.hash = `#/mine`; }, btn); } },
    h("h1", {}, id ? "Edit event" : "Create an event"), h("p", { class: "muted small" }, "New and edited events are reviewed by an admin before they appear publicly. Paid ticket types are saved but show as Coming soon."),
    h("div", { class: "card stack" }, inp("title", "Title", { max: 100 }), inp("tagline", "Tagline"), inp("descr", "Description", { area: true, max: 4000 }), inp("venue", "Venue", { max: 100 }), inp("city", "City", { max: 60 }), dt("starts", `Starts (${TZ || "your time zone"})`), dt("ends", "Ends"), inp("capacity", "Total capacity", { max: 6 })), lists,
    h("div", { class: "row" }, btn, h("a", { class: "btn", href: "#/mine" }, "Cancel"))), "mine");
}
async function checkin(id) {
  const d = await api(`/api/events/${id}/attendees`); const e = d.event; let list = d.attendees;
  const res = h("div", { class: "res", "aria-live": "polite" }, "Scan or type a ticket code");
  const stats = h("div", { class: "row" }); const body = h("tbody"); let filter = "";
  const code = h("input", { placeholder: "Ticket code (AIS-…)", autocapitalize: "characters", "aria-label": "Ticket code", autofocus: true });
  const draw = () => {
    const n = list.filter((a) => a.checked).length; stats.replaceChildren(h("span", { class: "badge acc" }, `${n} checked in`), h("span", { class: "badge" }, `${list.length} registered`), h("span", { class: "badge" }, `${e.capacity} capacity`));
    body.replaceChildren(...list.filter((a) => !filter || (a.name + a.email + a.code).toLowerCase().includes(filter)).map((a) => h("tr", {}, h("td", {}, a.name, h("div", { class: "muted small" }, a.email)), h("td", { class: "code small" }, a.code), h("td", {}, a.tier || ""), h("td", {}, a.checked ? h("span", { class: "badge ok" }, "In") : h("span", { class: "badge" }, "Not yet")),
      h("td", {}, h("button", { class: "btn sm", onclick: () => send(a.code, !!a.checked) }, a.checked ? "Undo" : "Check in")))));
  };
  const send = async (c, undo) => {
    try {
      const r = await api(`/api/events/${e.id}/checkin`, { code: c, undo });
      const map = { ok: ["ok", `✓ Welcome, ${r.name} (${r.tier})`], already: ["warn", `Already checked in: ${r.name}, ${ago(r.at)}`], invalid: ["bad", "✗ Not a ticket for this event"], undone: ["", `Check-in undone for ${r.name}`] };
      res.className = "res " + map[r.result][0]; res.textContent = map[r.result][1];
      const a = list.find((x) => x.code === r.code); if (a) a.checked = r.result === "ok" ? Date.now() : r.result === "undone" ? null : a.checked; draw();
    } catch (er) { toast(er.message, true); }
    code.value = ""; code.focus();
  };
  const scan = h("button", { class: "btn", type: "button", onclick: async () => {
    if (!("BarcodeDetector" in window)) return toast("Camera scanning isn't supported in this browser. Type the code or use a barcode scanner.", true);
    try { const v = h("video", { autoplay: true, playsinline: true, style: "width:100%;border-radius:12px" }); const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); v.srcObject = st;
      const det = new BarcodeDetector({ formats: ["qr_code"] }); const mm = modal("Scan ticket", v); let on = true; const stop = () => { on = false; st.getTracks().forEach((x) => x.stop()); };
      mm.el.querySelector("button").addEventListener("click", stop); document.addEventListener("keydown", (k) => k.key === "Escape" && stop(), { once: true });
      const loop = async () => { if (!on) return; try { const r = await det.detect(v); if (r[0]) { stop(); mm.close(); send(r[0].rawValue, false); return; } } catch { /* retry */ } setTimeout(loop, 300); }; loop();
    } catch { toast("Couldn't open the camera.", true); } } }, "Scan with camera");
  shell(h("div", { class: "stack" }, h("div", { class: "row spread" }, h("div", {}, h("h1", { style: "margin:0" }, `Check-in: ${e.title}`), h("a", { href: `#/e/${e.slug}`, class: "small" }, "← Event page")), h("div", { class: "row" }, h("button", { class: "btn sm", onclick: () => { const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`; download(`${e.slug}-attendees.csv`, "text/csv", "name,email,ticket,code,registered,checked_in\n" + list.map((a) => [a.name, a.email, a.tier, a.code, new Date(a.created).toISOString(), a.checked ? new Date(a.checked).toISOString() : ""].map(esc).join(",")).join("\n")); } }, "Export CSV"))),
    h("form", { class: "card stack", onsubmit: (ev) => { ev.preventDefault(); if (code.value.trim()) send(code.value, false); } }, h("div", { class: "row" }, h("div", { class: "grow" }, code), h("button", { class: "btn pri" }, "Check in"), scan), res), stats,
    h("div", { class: "card stack" }, h("input", { type: "search", placeholder: "Search attendees", "aria-label": "Search attendees", oninput: (x) => { filter = x.target.value.toLowerCase(); draw(); } }), h("div", { class: "tw" }, h("table", { class: "t" }, h("thead", {}, h("tr", {}, ["Attendee", "Code", "Ticket", "Status", ""].map((x) => h("th", {}, x)))), body)))), "mine");
  draw(); setTimeout(() => code.focus(), 50);
}
async function admin() {
  const d = await api("/api/admin/pending").catch(() => ({ events: [] }));
  const q = h("div", { class: "card stack" }, h("h2", {}, `Events waiting for review (${d.events.length})`), d.events.length ? d.events.map((e) => { const why = h("input", { placeholder: "Reason if rejecting", maxlength: 300 });
    return h("div", { class: "card stack", style: "box-shadow:none" }, h("div", { class: "row spread" }, h("div", {}, h("a", { href: `#/e/${e.slug}`, style: "font-weight:700" }, e.title), h("div", { class: "muted small" }, `${e.oname || "?"} · ${e.oemail || ""} · ${fDT(e.starts)}`))), h("div", { class: "small" }, e.tagline), h("div", { class: "small muted" }, `${e.tiers.length} ticket types · ${e.speakers.length} speakers · ${e.sessions.length} sessions`), why,
      h("div", { class: "row" }, h("button", { class: "btn sm pri", onclick: () => guard(async () => { await api(`/api/admin/event/${e.id}`, { status: "approved" }); toast("Approved"); admin(); }) }, "Approve"), h("button", { class: "btn sm", onclick: () => guard(async () => { await api(`/api/admin/event/${e.id}`, { status: "rejected", reason: why.value }); toast("Rejected"); admin(); }) }, "Reject"))); }) : h("p", { class: "muted" }, "Nothing waiting."));
  shell(h("div", { class: "stack" }, adminView("AI Summit", (a) => h("div", { class: "grid" }, [["Real events", a.events], ["Waiting review", a.pending], ["Tickets issued", a.tickets], ["Checked in", a.checked]].map(([l, n]) => h("div", { class: "card" }, h("div", { class: "muted small" }, l), h("div", { class: "stat" }, n))))), q), "admin");
}
async function plans() { const d = await api("/api/plans"); shell(h("div", { class: "stack" }, h("h1", {}, "Plans"), plansView(d.plans, S.user ? S.user.plan : ""), h("p", { class: "muted small" }, "Paid plans aren't available yet. Everything on the Free plan works today.")), "plans"); }
function login() { shell(h("div", { class: "row", style: "justify-content:center" }, authForm((u) => { S.user = u; location.hash = "#/"; route(); }, { title: "Log in or sign up", sub: "Create events and keep your tickets in one place." })), "login"); }
function account() {
  const name = h("input", { value: S.user.name, maxlength: 60 }), cur = h("input", { type: "password" }), np = h("input", { type: "password" });
  shell(h("div", { class: "stack", style: "max-width:520px" }, h("h1", {}, "Account"), h("div", { class: "muted" }, `${S.user.email} · ${S.user.plan === "pro" ? "Pro" : "Free"} plan`),
    h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { S.user = (await api("/api/auth/profile", { name: name.value })).user; toast("Saved"); }); } }, h("h3", {}, "Profile"), field("Name", name), h("button", { class: "btn pri" }, "Save")),
    h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { await api("/api/auth/password", { current: cur.value, password: np.value }); cur.value = np.value = ""; toast("Password changed"); }); } }, h("h3", {}, "Change password"), field("Current password", cur), field("New password (8+ characters)", np), h("button", { class: "btn" }, "Change password")),
    h("button", { class: "btn", onclick: () => guard(async () => { await api("/api/auth/logout", {}); S.user = null; location.hash = "#/"; route(); }) }, "Log out")), "account");
}
async function route() {
  scrollTo(0, 0);
  if (location.pathname === "/by-mahmoud") { if (location.hash.length > 1) history.replaceState(null, "", "/" + location.hash); else return shell(byMahmoudView(), ""); }
  const p = location.hash.replace(/^#/, "") || "/"; let m; document.title = "AI Summit: events, tickets and check-in";
  try {
    if (p === "/") return await home();
    if ((m = p.match(/^\/e\/([a-z0-9-]+)$/))) return await eventPage(m[1]);
    if ((m = p.match(/^\/t\/(AIS-[A-Za-z0-9]+)$/))) return await ticketPage(m[1].toUpperCase());
    if (p === "/lookup") return lookup();
    if (p === "/login") return login();
    if (p === "/plans") return await plans();
    const need = ["/tickets", "/mine", "/new", "/account", "/admin"];
    if ((need.includes(p) || /^\/(edit|checkin)\//.test(p)) && !S.user) return login();
    if (p === "/tickets") return await myTickets(); if (p === "/mine") return await myEvents(); if (p === "/new") return await editor(); if (p === "/account") return account(); if (p === "/admin") return await admin();
    if ((m = p.match(/^\/edit\/([a-z0-9]+)$/))) return await editor(m[1]);
    if ((m = p.match(/^\/checkin\/([a-z0-9]+)$/))) return await checkin(m[1]);
    location.hash = "#/";
  } catch (e) {
    if (e.status === 401) { S.user = null; return login(); }
    shell(h("div", { class: "card empty" }, h("h2", {}, "Couldn't load this page"), h("p", {}, e.message), h("a", { class: "btn", href: "#/" }, "Home")), "home");
  }
}
addEventListener("hashchange", route);
(async () => { try { S.user = (await api("/api/auth/me")).user; } catch { /* offline */ } route(); })();
