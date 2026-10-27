import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TypingArea } from '@/components/typing/TypingArea';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, isBackendConfigured } from '@/services/php-api';
import type { SessionConfig, SessionResult } from '@/lib/typing-core/types';
import { LocalClassroomAdapter, classroomStorageKey, CLASSROOM_CLEAR_EVENT, forgetClassroomMemory } from '@/domain/classroom/local-adapter';
import { aggregateAccuracy, classroomReport, importClassroomReport, type Classroom, type ClassAggregate } from '@/domain/classroom/model';
import { downloadCertificate, printCertificate } from '@/domain/classroom/certificate';
import { ManualReportForm } from '@/components/classroom/ManualReportForm';
import { refreshTeacherProgress } from '@/domain/classroom/refresh';

interface Student { classId: string; classTitle: string; memberId: string; alias: string; configuration: SessionConfig }
const download = (data: unknown) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sparowtype-classroom-aggregates.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export default function ClassroomPage() {
  const { user } = useAuth(), owner = user?.id ?? 'guest';
  const [mode, setMode] = useState<'local' | 'server'>('local');
  const [localRevision, setLocalRevision] = useState(0);
  const local = useMemo(() => {
    // A storage/clear event deliberately invalidates the owner-scoped adapter.
    void localRevision;
    return new LocalClassroomAdapter(owner);
  }, [owner, localRevision]);
  const [classes, setClasses] = useState<Classroom[]>([]), [title, setTitle] = useState('');
  const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [privateCode, setPrivateCode] = useState('');
  const [code, setCode] = useState(''), [alias, setAlias] = useState(''), [student, setStudent] = useState<Student | null>(null);
  const [studentResult, setStudentResult] = useState<SessionResult | null>(null), [includeAlias, setIncludeAlias] = useState(false);
  const scope = useRef(''), generation = useRef(0); scope.current = `${owner}:${mode}`;
  useEffect(() => {
    const storage = (event: StorageEvent) => { if (event.key === classroomStorageKey(owner) || event.key === null) { if (event.newValue === null) forgetClassroomMemory(owner); setLocalRevision(value => value + 1); } };
    const cleared = (event: Event) => { if ((event as CustomEvent<{ ownerId: string }>).detail?.ownerId === owner) setLocalRevision(value => value + 1); };
    window.addEventListener('storage', storage); window.addEventListener(CLASSROOM_CLEAR_EVENT, cleared);
    return () => { window.removeEventListener('storage', storage); window.removeEventListener(CLASSROOM_CLEAR_EVENT, cleared); };
  }, [owner]);
  useEffect(() => {
    const requestScope = scope.current, controller = new AbortController(), guard = generation; guard.current++;
    const requestGeneration = guard.current;
    setPrivateCode(''); setNotice(''); setStudent(null); setStudentResult(null); setBusy(false);
    if (mode === 'local') { setClasses(local.snapshot().classes); if (local.error) setNotice(local.error); }
    else if (user) {
      setClasses([]);
      void apiRequest<{ ownerId: string; classes: Classroom[] }>('/classroom', { expectedOwner: owner, signal: controller.signal }).then(value => {
        if (scope.current === requestScope && guard.current === requestGeneration && value.ownerId === owner) setClasses(value.classes);
      }).catch(error => { if (!controller.signal.aborted && scope.current === requestScope && guard.current === requestGeneration) setNotice(error instanceof Error ? error.message : 'Classroom service is unavailable.'); });
    } else setClasses([]);
    return () => { controller.abort(); guard.current++; };
  }, [local, mode, owner, user]);
  const perform = async (operation: () => Promise<void>) => {
    const before = scope.current, request = ++generation.current; setBusy(true); setNotice('');
    try { await operation(); } catch (error) { if (scope.current === before && generation.current === request) setNotice(error instanceof Error ? error.message : 'The action could not be completed.'); }
    finally { if (scope.current === before && generation.current === request) setBusy(false); }
  };
  const create = () => void perform(async () => {
    if (mode === 'local') { const room = local.create(title); setClasses(local.snapshot().classes); setPrivateCode(room.localCode ?? ''); setNotice('Device-only class created. This code cannot join another device. Use aggregate report export/import.'); }
    else {
      const current = scope.current;
      const value = await apiRequest<{ ownerId: string; class: Classroom; privateCode: string }>('/classroom/create', { method: 'POST', expectedOwner: owner, body: { title } });
      if (scope.current !== current || value.ownerId !== owner) return;
      setClasses(previous => [value.class, ...previous]); setPrivateCode(value.privateCode); setNotice('Save the private code now. The server keeps only hashes and cannot display it again.');
    }
    setTitle('');
  });
  const refreshProgress = () => void perform(async () => {
    if (mode !== 'server' || !user) return;
    const current = scope.current, request = generation.current;
    const updated = await refreshTeacherProgress({ ownerId: owner,
      isCurrent: () => scope.current === current && generation.current === request,
      load: () => apiRequest<{ ownerId: string; classes: Classroom[] }>('/classroom', { expectedOwner: owner }),
      publish: setClasses,
    });
    if (updated) setNotice('Progress refreshed from the server. Only shared aggregate reports are shown.');
  });
  const remove = (room: Classroom) => void perform(async () => {
    if (mode === 'local') { local.remove(room.id); setClasses(local.snapshot().classes); }
    else {
      const current = scope.current;
      const value = await apiRequest<{ ownerId: string; deleted: boolean }>('/classroom/delete', { method: 'POST', expectedOwner: owner, body: { classId: room.id } });
      if (scope.current !== current || value.ownerId !== owner) return;
      setClasses(previous => previous.filter(item => item.id !== room.id));
    }
    setPrivateCode(''); setNotice('Classroom and its alias reports were removed.');
  });
  const join = () => void perform(async () => {
    const current = scope.current;
    const value = await apiRequest<{ student: Student; privacy: string }>('/classroom/student/join', { method: 'POST', body: { code, alias } });
    if (scope.current !== current) return;
    setStudent(value.student); setStudentResult(null); setCode(''); setNotice(value.privacy);
  });
  const complete = (result: SessionResult) => {
    if (!student || result.ownerScope !== student.memberId) return;
    setStudentResult(result);
  };
  const report = () => void perform(async () => {
    if (!studentResult || !student) return;
    const current = scope.current, member = student.memberId;
    const value = await apiRequest<{ accepted: boolean; duplicate: boolean; verification: string; configuration: SessionConfig }>('/classroom/student/progress', { method: 'POST', body: { candidate: studentResult, shareConsent: true } });
    if (scope.current !== current || !value.accepted) return;
    setStudent(previous => previous?.memberId === member ? { ...previous, configuration: value.configuration } : previous); setStudentResult(null);
    setNotice('Aggregate mathematics were replay-checked and shared. Human identity and independent typing are not verified. Typed text is not retained in classroom reports.');
  });
  const certificate = (member: ClassAggregate, type: 'png' | 'print') => {
    try { if (type === 'print') printCertificate(member, includeAlias); else void downloadCertificate(member, includeAlias).catch(error => setNotice(error instanceof Error ? error.message : 'Image export failed.')); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Printing is unavailable.'); }
  };
  return <div className="forge-shell"><Header /><main id="main-content" className="forge-main space-y-6">
    <div><p className="eyebrow">PRIVATE, SMALL-GROUP PRACTICE</p><h1 className="text-4xl font-semibold mt-3">Classroom lite</h1><p className="text-sm text-muted-foreground mt-3 max-w-3xl">Choose aliases instead of student emails. Teachers receive aggregate practice statistics; typed passages and keystroke logs never appear in their reports. Participation summaries are not employment or identity-verified certificates.</p></div>
    <div role="group" aria-label="Classroom storage mode" className="flex flex-wrap gap-3"><button className="forge-button-secondary" aria-pressed={mode === 'local'} disabled={busy} onClick={() => setMode('local')}>Device-only classroom</button><button className="forge-button-secondary" aria-pressed={mode === 'server'} disabled={busy || !isBackendConfigured} onClick={() => setMode('server')}>Server classroom</button></div>
    <p className="panel p-4 text-sm text-muted-foreground">{mode === 'local' ? 'Device-only mode: classes and manual reports stay in this browser. Local codes are labels, not online invitations. Exchange bounded JSON aggregates manually; no online acceptance is implied.' : 'Server mode: teachers sign in; students use a private code and an alias without creating an email account. Sharing a practice result is an explicit action.'}{!isBackendConfigured && ' Server classroom features are unavailable in this frontend-only installation.'}</p>
    {mode === 'server' && user && <div className="flex flex-wrap gap-3 items-center"><button className="forge-button-secondary" disabled={busy} onClick={refreshProgress} aria-label="Refresh progress" aria-busy={busy}>Refresh progress</button><p className="text-xs text-muted-foreground">Fetch the latest reports shared by your students. Progress does not update automatically.</p></div>}
    {notice && <p role="status" className="panel p-4 text-sm">{notice}</p>}
    {privateCode && <section className="panel p-5" aria-label="New private class code"><h2 className="font-medium">Save your {mode === 'local' ? 'device-only label' : 'private classroom code'}</h2><code className="block font-mono text-sm break-all mt-3">{privateCode}</code><button className="forge-button-secondary mt-3" onClick={() => setPrivateCode('')}>Hide code</button></section>}
    {(mode === 'local' || user) ? <form className="panel p-5 flex flex-wrap items-end gap-4" onSubmit={event => { event.preventDefault(); create(); }}><label className="text-sm grow">Classroom title<input className="forge-input mt-2" value={title} onChange={event => setTitle(event.target.value)} minLength={2} maxLength={80} required disabled={busy} /></label><button className="forge-button" disabled={busy || title.trim().length < 2}>Create {mode === 'local' ? 'device-only' : 'private'} classroom</button></form> : <p className="text-sm"><Link className="forge-button-secondary" to="/auth">Teacher sign in</Link> Students can join below without an email address.</p>}
    {mode === 'server' && !student && <form className="panel p-5 space-y-4" onSubmit={event => { event.preventDefault(); join(); }}><h2 className="text-xl font-medium">Join as a student</h2><p className="text-xs text-muted-foreground">Use a nickname that does not identify you outside the class. Only your current browser session receives the student capability; the returned UUID is not a login password.</p><div className="grid sm:grid-cols-2 gap-4"><label className="text-sm">Private class code<input className="forge-input mt-2 font-mono" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} maxLength={64} required /></label><label className="text-sm">Classroom alias<input className="forge-input mt-2" autoComplete="off" value={alias} onChange={event => setAlias(event.target.value)} minLength={2} maxLength={32} required /></label></div><button className="forge-button" disabled={busy}>Join private classroom</button></form>}
    {student && mode === 'server' && <section className="panel p-5" aria-label="Student classroom practice"><h2 className="text-xl font-medium">{student.classTitle} · {student.alias}</h2><p className="text-xs text-muted-foreground mt-2">The original assignment is server-issued. Sharing sends canonical event evidence to the server for a replay check; classroom storage retains aggregates and a hash only. The teacher never receives your typed text. No general account access is granted.</p>{studentResult ? <div className="mt-5"><p>{studentResult.metrics.wpm?.toFixed(1) ?? '—'} WPM · {studentResult.metrics.inputAccuracy?.toFixed(1) ?? '—'}% input accuracy · not yet shared</p><button className="forge-button mt-4" disabled={busy || studentResult.finishReason !== 'completed'} onClick={report}>Share aggregate result</button><button className="forge-button-secondary mt-4 ml-3" disabled={busy} onClick={() => setStudentResult(null)}>Retry without sharing</button></div> : <TypingArea key={student.configuration.clientSessionId} configuration={student.configuration} onTestComplete={complete} autoFocus />}<button className="forge-button-secondary mt-4" disabled={busy} onClick={() => void perform(async () => { const current = scope.current; await apiRequest('/classroom/student/leave', { method: 'POST' }); if (scope.current !== current) return; setStudent(null); setStudentResult(null); setNotice('Classroom membership and its aggregate reports were deleted.'); })}>Leave and delete my class reports</button></section>}
    <label className="min-h-11 flex items-center gap-3 text-sm"><input type="checkbox" checked={includeAlias} onChange={event => setIncludeAlias(event.target.checked)} /> Include the selected alias on exported participation summaries (off by default)</label>
    {classes.map(room => <section className="panel p-5 space-y-4" key={room.id} aria-label={`Classroom ${room.title}`}><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-medium">{room.title}</h2><p className="text-xs text-muted-foreground mt-1">{room.members.length} aliases · {mode === 'local' ? 'manually reported, device-only' : 'replay-checked math; people unverified'}</p></div><div className="flex flex-wrap gap-2"><button className="forge-button-secondary" onClick={() => download(classroomReport(room))}>Export aggregates</button><button className="forge-button-secondary" disabled={busy} onClick={() => remove(room)}>Delete classroom and reports</button></div></div>
      {mode === 'local' && <label className="block text-sm">Import a bounded aggregate report (replaces this class’s current manual rows)<input className="forge-input mt-2 min-h-11" type="file" accept="application/json,.json" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 64000) { setNotice('Reports are limited to 64KB.'); return; } const current = scope.current; void file.text().then(text => { if (scope.current !== current) return; local.replaceMembers(room.id, importClassroomReport(text)); setClasses(local.snapshot().classes); setNotice(local.error ?? 'Manual aggregate rows imported. No online verification is implied.'); }).catch(error => setNotice(error instanceof Error ? error.message : 'Import failed.')); event.target.value = ''; }} /></label>}
      {mode === 'local' && <ManualReportForm onAdd={report => { local.replaceMembers(room.id, [...room.members, report]); setClasses(local.snapshot().classes); setNotice(local.error ?? 'Unverified manual aggregate added.'); }} />}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Aliases and aggregate practice only; no email or typed content</caption><thead><tr>{['Alias', 'Sessions', 'Active minutes', 'Input accuracy', 'Best WPM', 'Participation summary'].map(label => <th scope="col" className="p-3 whitespace-nowrap" key={label}>{label}</th>)}</tr></thead><tbody>{room.members.map(member => <tr key={member.id}><th scope="row" className="p-3">{member.alias}</th><td>{member.sessions}</td><td>{(member.activeMs / 60000).toFixed(1)}</td><td>{aggregateAccuracy(member) === null ? '—' : `${aggregateAccuracy(member)!.toFixed(1)}%`}</td><td>{member.bestWpm.toFixed(1)}</td><td className="flex flex-wrap gap-2 p-2"><button className="forge-button-secondary" onClick={() => certificate(member, 'png')}>PNG</button><button className="forge-button-secondary" onClick={() => certificate(member, 'print')}>Print / Save PDF</button></td></tr>)}</tbody></table></div>{!room.members.length && <p className="text-sm text-muted-foreground">No class reports yet. Nothing has been inferred or fabricated.</p>}
    </section>)}
    <p className="text-xs text-muted-foreground">Private codes belong only in your trusted class channel. The application does not send invitations or third-party tracking. Deleting a server classroom or teacher account cascades its class data. Browser printing depends on your device’s print/PDF support.</p>
  </main><Footer /></div>;
}
