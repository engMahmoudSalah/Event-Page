// Ticket registry on the shared gfk-api backend (Cloudflare KV, free tier).
// Best effort: registration still goes to Formspree, the registry adds a live count and ticket lookup.
const API = 'https://gfk-api.mahmodsalah.workers.dev/v1/event-page';

export async function registerTicket(data: { name: string; email: string; role?: string; ticket_name: string; ticket_price?: string; ticket_number: string }) {
  try {
    const r = await fetch(`${API}/reg`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
export async function getCount(): Promise<number | null> {
  try {
    const r = await fetch(`${API}/count`);
    return r.ok ? (await r.json()).count : null;
  } catch {
    return null;
  }
}
export async function lookupTicket(id: string): Promise<{ id: string; ticket: string; holder: string; at: string } | 'not_found' | null> {
  const clean = id.trim().toUpperCase();
  if (!/^[A-Z]{2,4}-[0-9]{4,10}$/.test(clean)) return 'not_found';
  try {
    const r = await fetch(`${API}/ticket/${clean}`);
    if (r.status === 404) return 'not_found';
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
