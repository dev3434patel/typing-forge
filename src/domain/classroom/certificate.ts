import { aggregateAccuracy, type ClassAggregate } from './model';
export function certificateFacts(member: ClassAggregate, includeAlias = false) {
  return { title: 'Practice participation summary', alias: includeAlias ? member.alias : null, sessions: member.sessions, minutes: member.activeMs / 60000, inputAccuracy: aggregateAccuracy(member), bestWpm: member.bestWpm, statement: member.verification === 'replay-checked-not-human-verified' ? 'Replay-checked classroom mathematics. Human identity and independent typing are not verified.' : 'Manually reported local classroom practice. Not a verified speed certificate.' };
}
export function certificateHtml(member: ClassAggregate, includeAlias = false): string {
  const facts = certificateFacts(member, includeAlias);
  const escape = (text: string) => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SparowType practice summary</title><style>body{font-family:system-ui,sans-serif;padding:48px;color:#12151c}main{border:2px solid #27aae1;padding:48px;max-width:900px;margin:auto}h1{font-size:36px}dl{display:grid;grid-template-columns:1fr 1fr;gap:24px}dt{font-size:14px}dd{margin:8px 0;font-size:28px}p{line-height:1.6}@media print{body{padding:0}button{display:none}}</style><main><p>SparowType</p><h1>${escape(facts.title)}</h1>${facts.alias ? `<h2>${escape(facts.alias)}</h2>` : ''}<dl><div><dt>Practice sessions</dt><dd>${facts.sessions}</dd></div><div><dt>Active practice</dt><dd>${facts.minutes.toFixed(1)} minutes</dd></div><div><dt>Input accuracy</dt><dd>${facts.inputAccuracy === null ? 'Not measured' : `${facts.inputAccuracy.toFixed(1)}%`}</dd></div><div><dt>Best reported WPM</dt><dd>${facts.bestWpm.toFixed(1)}</dd></div></dl><p>${escape(facts.statement)}</p><p>No email, private class code or typed passage is included.</p></main></html>`;
}
export async function downloadCertificate(member: ClassAggregate, includeAlias = false) {
  await document.fonts.ready;
  const facts = certificateFacts(member, includeAlias);
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Image export is unavailable. Use Print / Save PDF.');
  context.fillStyle = '#F7F8FA'; context.fillRect(0, 0, 1200, 800); context.strokeStyle = '#27aae1'; context.lineWidth = 4; context.strokeRect(35, 35, 1130, 730);
  context.fillStyle = '#12151C'; context.font = '700 32px Sora,sans-serif'; context.fillText('SparowType', 80, 110); context.font = '600 38px Inter,sans-serif'; context.fillText(facts.title, 80, 200);
  context.font = '24px Inter,sans-serif'; if (facts.alias) context.fillText(facts.alias, 80, 255);
  context.fillText(`${facts.sessions} practice sessions · ${facts.minutes.toFixed(1)} active minutes`, 80, 350);
  context.fillText(`Input accuracy: ${facts.inputAccuracy === null ? 'not measured' : `${facts.inputAccuracy.toFixed(1)}%`} · Best reported WPM: ${facts.bestWpm.toFixed(1)}`, 80, 410);
  context.font = '20px Inter,sans-serif';
  context.fillText(member.verification === 'manual-unverified' ? 'Manually reported local practice; not a verified speed certificate.' : 'Replay-checked math; human identity and independent typing are unverified.', 80, 560);
  context.fillText('No email, private class code or typed passage is included.', 80, 610);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve)); if (!blob) throw new Error('Image export failed.');
  const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sparowtype-practice-summary.png'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function printCertificate(member: ClassAggregate, includeAlias = false) {
  const popup = window.open('', '_blank'); if (!popup) throw new Error('Allow this print window, or download the PNG.');
  popup.opener = null; popup.document.open(); popup.document.write(certificateHtml(member, includeAlias)); popup.document.close(); popup.focus(); popup.print();
}
