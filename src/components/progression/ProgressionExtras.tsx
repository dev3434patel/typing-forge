import { useState } from 'react';
import { Link } from 'react-router-dom';
import { seasonTrack } from '@/domain/progression/season';
import { suggestedReminderHour } from '@/domain/engagement/reminders';
import type { Profile, League } from '@/domain/progression/types';
import { readReminderPreferences, saveReminderPreferences } from '@/services/reminders';
import { readSeasonBanner, saveSeasonBanner } from '@/services/season-customization';

export function ProgressionExtras({ profile, league, now }: { profile: Profile; league?: League | null; now: number }) {
  const track = seasonTrack(profile, new Date(now).toISOString().slice(0, 10));
  const [reminders, setReminders] = useState(() => readReminderPreferences(profile.ownerId));
  const [hour, setHour] = useState(String(reminders.hour));
  const [notice, setNotice] = useState('');
  const [banner, setBanner] = useState<number | null>(() => readSeasonBanner(profile, new Date(now).toISOString().slice(0, 10)));
  const selected = track.tiers.find(tier => tier.tier === banner && tier.unlocked);
  const share = async (kind: 'progress' | 'streak' | 'league') => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
    const context = canvas.getContext('2d'); if (!context) { setNotice('Image export is unavailable in this browser. Reward JSON remains available.'); return; }
    await document.fonts.ready;
    context.fillStyle = '#07070A'; context.fillRect(0, 0, 1200, 630);
    context.fillStyle = '#EDEDF2'; context.font = '700 42px Sora, sans-serif'; context.fillText('Sparow', 64, 92); const width = context.measureText('Sparow').width; context.fillStyle = '#C6FF3D'; context.fillText('Type', 64 + width, 92);
    context.font = '500 24px Inter, sans-serif'; context.fillStyle = '#B6B6C6'; context.fillText(profile.verification === 'server-verified' ? 'Server-replayed practice' : 'Local practice · unverified', 64, 150);
    context.font = '700 94px Sora, sans-serif'; context.fillStyle = '#EDEDF2';
    const headline = kind === 'streak' ? `${profile.streak.count} days` : kind === 'league' ? league?.rank ? `Rank ${league.rank}` : 'Unplaced' : `${profile.xp.toLocaleString()} XP`;
    let headlineSize = 94;
    while (context.measureText(headline).width > 1072 && headlineSize > 40) { headlineSize -= 2; context.font = `700 ${headlineSize}px Sora, sans-serif`; }
    context.fillText(headline, 64, 318);
    context.font = '500 30px Inter, sans-serif'; context.fillStyle = '#B6B6C6'; context.fillText(kind === 'league' && league ? `${league.tier} · ${league.week}` : `Level ${profile.level} · ${profile.title}`, 64, 390);
    context.font = '400 22px Inter, sans-serif'; context.fillText('A little practice. Lasting progress.', 64, 536);
    canvas.toBlob(blob => { if (!blob) { setNotice('Image export could not be prepared.'); return; } const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `sparowtype-${kind}.png`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'image/png');
  };
  return <>
    <section className="panel p-5 sm:p-7" aria-labelledby="season-title"><h2 id="season-title" className="text-lg font-medium">Your four-week collection</h2><p className="text-sm text-muted-foreground mt-2">{track.start} to {track.end} · {track.xp.toLocaleString()} {profile.verification === 'local' ? 'local' : 'server-replayed'} XP. Every 500 XP unlocks a free profile banner; there are 30 tiers. This collection never changes typing or rankings.</p>
      <div className="rounded-xl border p-5 mt-5" style={selected ? { borderColor: selected.color, background: `linear-gradient(110deg,${selected.color}20,transparent)` } : undefined}><p className="font-medium">{selected ? selected.label : 'Choose an unlocked banner to preview'}</p><p className="text-sm text-muted-foreground mt-2">Level {profile.level} · {profile.title}</p></div>
      <ol className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 mt-5">{track.tiers.map(tier => <li key={tier.rewardId}><button className="w-full min-h-16 rounded-lg border p-2 text-sm" aria-label={`Tier ${tier.tier}, ${tier.threshold} XP, ${tier.unlocked ? 'unlocked' : 'locked'}`} aria-pressed={selected?.tier === tier.tier} disabled={!tier.unlocked} onClick={() => { setBanner(tier.tier); try { saveSeasonBanner(profile, new Date(now).toISOString().slice(0, 10), tier.tier); setNotice('Season banner saved for this profile.'); } catch { setNotice('Previewing this visit. The banner could not be persisted.'); } }}><span className="font-mono">{tier.tier}</span><span className="block text-xs mt-1">{tier.unlocked ? 'Unlocked' : `${tier.threshold} XP`}</span></button></li>)}</ol>
      <p className="text-xs text-muted-foreground mt-4">Unlocks are recomputed from the same scoped reward receipts. Device and account collections stay separate. Preview contains no paid advantage.</p>
    </section>
    <section className="panel p-5 sm:p-7" aria-labelledby="reminder-title"><h2 id="reminder-title" className="text-lg font-medium">A gentle practice reminder</h2><p className="text-sm text-muted-foreground mt-2">Optional in-app reminders while SparowType is open. No background push or third-party delivery. At most one per calendar day and never less than 24 hours apart. Reminders wait while you type.</p>
      <form className="flex flex-wrap items-end gap-4 mt-5" onSubmit={event => { event.preventDefault(); const value = Number(hour); if (!Number.isInteger(value) || value < 0 || value > 23) { setNotice('Choose a whole hour from 0 to 23.'); return; } try { const next = { ...reminders, hour: value }; saveReminderPreferences(profile.ownerId, next); setReminders(next); setNotice(next.enabled ? 'In-app reminders enabled. You can turn them off here at any time.' : 'Reminders turned off.'); } catch { setNotice('Reminders need working local storage; no reminder was scheduled.'); } }}>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-6" checked={reminders.enabled} onChange={event => setReminders(value => ({ ...value, enabled: event.target.checked }))} />Enable reminders</label>
        <label className="text-sm">Preferred local hour<input className="forge-input mt-2 w-24" type="number" min="0" max="23" step="1" value={hour} onChange={event => setHour(event.target.value)} /></label><button className="forge-button-secondary" type="submit">Save reminder choice</button>
        <button className="forge-button-secondary" type="button" onClick={() => setHour(String(suggestedReminderHour(profile.receipts.map(receipt => receipt.at), reminders.timeZone)))}>Use my usual practice hour</button>
      </form><p className="text-xs text-muted-foreground mt-3">Time zone: {reminders.timeZone}. Automatic reminders stay disabled in browsers without cross-tab Web Locks.</p>
    </section>
    <section className="panel p-5 sm:p-7"><h2 className="text-lg font-medium">Share a measured milestone</h2><p className="text-sm text-muted-foreground mt-2">Images contain totals and the verification scope. Your name, email, private text and other participants are excluded.</p><div className="flex flex-wrap gap-2 mt-4"><button className="forge-button-secondary" onClick={() => void share('progress')}>Share progress image</button><button className="forge-button-secondary" onClick={() => void share('streak')}>Share streak image</button>{league && <button className="forge-button-secondary" onClick={() => void share('league')}>Share league image</button>}<Link className="forge-button-secondary" to="/lessons">Open a lesson · repair practice</Link></div></section>
    <p role="status" aria-live="polite" className="text-sm">{notice}</p>
  </>;
}
