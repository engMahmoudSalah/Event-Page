import React, { useEffect, useState } from 'react';
import { getCount, lookupTicket } from './registry';

// Live registration count + ticket verification by ticket number.
export default function TicketCheck() {
  const [count, setCount] = useState<number | null>(null);
  const [id, setId] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'found' | 'missing' | 'error'>('idle');
  const [info, setInfo] = useState<{ ticket: string; holder: string; at: string } | null>(null);

  useEffect(() => { getCount().then(setCount); }, []);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy'); setInfo(null);
    const r = await lookupTicket(id);
    if (r === 'not_found') setState('missing');
    else if (!r) setState('error');
    else { setInfo(r); setState('found'); }
  };

  return (
    <section id="ticket-check" className="max-w-4xl mx-auto px-4 pb-20 relative z-10">
      <div className="bg-white rounded-3xl p-8 md:p-10 brutalist-border shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold">تحقق من تذكرتك</h2>
          {count !== null && count > 0 && (
            <span className="text-sm font-bold bg-[#d7ff00] brutalist-border rounded-full px-4 py-1" aria-live="polite">{count} {count === 1 ? 'حجز' : 'حجز مؤكد'} لحد دلوقتي</span>
          )}
        </div>
        <p className="text-gray-600 mb-6">اكتب رقم تذكرتك (زي MD-123456) وتأكد إن حجزك اتسجل.</p>
        <form onSubmit={check} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="tk-id" className="sr-only">رقم التذكرة</label>
          <input id="tk-id" dir="ltr" value={id} onChange={(e) => setId(e.target.value)} placeholder="MD-123456" autoComplete="off" required className="flex-1 rounded-2xl brutalist-border px-4 py-3 font-mono bg-gray-50" />
          <button disabled={state === 'busy'} className="bg-[#1a1a1a] text-white px-8 py-3 rounded-full font-bold hover:bg-[#c8c0ff] hover:text-black transition-colors disabled:opacity-60 brutalist-border">{state === 'busy' ? 'بنتأكد...' : 'تحقق'}</button>
        </form>
        <div role="status" className="mt-5 min-h-6">
          {state === 'found' && info && (
            <p className="rounded-2xl bg-green-100 px-4 py-3 font-medium">تذكرة صالحة ✓ نوع التذكرة: <b>{info.ticket}</b> · باسم: <b dir="ltr">{info.holder}</b> · اتسجلت {new Date(info.at).toLocaleDateString('ar-EG')}</p>
          )}
          {state === 'missing' && <p className="rounded-2xl bg-red-100 px-4 py-3 font-medium">مفيش تذكرة بالرقم ده. راجع الرقم وجرّب تاني.</p>}
          {state === 'error' && <p className="rounded-2xl bg-yellow-100 px-4 py-3 font-medium">مقدرناش نوصل للسيرفر دلوقتي. جرّب بعد شوية.</p>}
        </div>
      </div>
    </section>
  );
}
