import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COSMETICS } from '@/domain/progression/catalog';
import type { Profile } from '@/domain/progression/types';
import { seasonTrack } from '@/domain/progression/season';
import { readProgression } from '@/services/progression-storage';
import { subscribeProgression } from '@/services/progression-service';
import { readSeasonBanner } from '@/services/season-customization';
import { ProgressionAccountAdapter } from '@/services/progression-api';
import { isBackendConfigured } from '@/services/php-api';

export default function ProfileAppearance({ ownerId }: { ownerId: string }) {
  const [local, setLocal] = useState<Profile | null>(null), [account, setAccount] = useState<Profile | null>(null);
  const [verified, setVerified] = useState(false), [notice, setNotice] = useState('');
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLocal(null); setAccount(null); setVerified(false); setNotice('');
    const load = () => { void readProgression(ownerId).then(value => { if (alive) setLocal(value.profile); }).catch(() => { if (alive) setNotice('Your saved appearance could not be read. The original data is preserved.'); }); };
    load(); const unsubscribe = subscribeProgression(owner => { if (owner === ownerId) load(); });
    if (ownerId !== 'guest' && isBackendConfigured) void new ProgressionAccountAdapter(ownerId, controller.signal).load().then(value => { if (alive && value.ownerId === ownerId) setAccount(value.profile); }).catch(() => undefined);
    return () => { alive = false; controller.abort(); unsubscribe(); };
  }, [ownerId]);
  const profile = verified ? account : local;
  const cosmetic = COSMETICS.find(item => item.id === profile?.equipped && (item.category === 'frame' || item.category === 'banner'));
  const date = new Date().toISOString().slice(0, 10);
  const season = profile ? seasonTrack(profile, date) : null;
  const tier = profile ? readSeasonBanner(profile, date) : null;
  const banner = season?.tiers.find(item => item.tier === tier && item.unlocked);
  const color = cosmetic?.color ?? banner?.color;
  return <section className="panel p-6" aria-labelledby="profile-appearance-title" style={color ? { borderColor: color, backgroundImage: `linear-gradient(110deg,${color}18,transparent)` } : undefined}>
    <h2 id="profile-appearance-title" className="font-medium">Your practice identity</h2>
    <p className="text-xs text-muted-foreground mt-2">{verified ? 'Server-replayed account collection' : 'Device collection · unverified'}. Appearance never changes your scores.</p>
    {account && <button className="forge-button-secondary mt-4" onClick={() => setVerified(value => !value)}>{verified ? 'View device appearance' : 'View account appearance'}</button>}
    <p className="font-medium mt-5">{profile ? `Level ${profile.level} · ${profile.title}` : 'Loading your collection…'}</p>
    <p className="text-sm text-muted-foreground mt-2">{cosmetic?.label ?? banner?.label ?? 'A clear space for your next practice.'}</p>
    {notice && <p role="status" className="text-sm mt-3">{notice}</p>}
    <Link className="forge-button-secondary mt-5" to="/progression">Open your collection</Link>
  </section>;
}
