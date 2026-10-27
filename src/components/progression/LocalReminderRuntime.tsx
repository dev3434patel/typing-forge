import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTestStore } from '@/stores/test-store';
import { checkReminder } from '@/services/reminders';
import type { ReminderMessage } from '@/domain/engagement/reminders';
export default function LocalReminderRuntime() {
  const owner = useAuth().user?.id ?? 'guest';
  const [message, setMessage] = useState<ReminderMessage | null>(null);
  useEffect(() => {
    setMessage(null);
    const typing = () => useTestStore.getState().status === 'running' || document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLInputElement;
    const check = () => { if (!document.hidden) void checkReminder(owner, typing()).catch(() => undefined); };
    const receive = (event: Event) => { const detail = (event as CustomEvent<ReminderMessage & { ownerId: string }>).detail; if (detail.ownerId === owner && !typing()) setMessage(detail); };
    const clear = () => setMessage(null);
    window.addEventListener('sparowtype:local-reminder', receive); window.addEventListener('sparowtype:reminders-changed', clear);
    const focus = () => { if (typing()) clear(); }; document.addEventListener('focusin', focus);
    const timer = window.setInterval(check, 60000); check();
    return () => { clearInterval(timer); window.removeEventListener('sparowtype:local-reminder', receive); window.removeEventListener('sparowtype:reminders-changed', clear); document.removeEventListener('focusin', focus); };
  }, [owner]);
  if (!message) return null;
  return <aside role="status" aria-live="polite" className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-md rounded-xl border bg-card p-5 shadow-lg"><p className="font-medium">{message.title}</p><p className="text-sm text-muted-foreground mt-2">{message.body}</p><div className="flex flex-wrap gap-2 mt-3"><Link to="/learn" className="forge-button-secondary" onClick={() => setMessage(null)}>Open practice</Link><button className="forge-button-secondary" onClick={() => setMessage(null)}>Dismiss</button><Link to="/progression" className="forge-chip" onClick={() => setMessage(null)}>Reminder settings</Link></div></aside>;
}
