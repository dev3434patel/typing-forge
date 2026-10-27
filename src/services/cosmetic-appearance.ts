import { COSMETICS } from '@/domain/progression/catalog';
import type { Preferences } from '@/contexts/PreferencesContext';
import { savePracticeStyle } from './practice-style';
/** Apply only an explicit Equip action; subsequent manual preferences take priority. */
export function applyEquippedCosmetic(ownerId: string, id: string, update: (patch: Partial<Preferences>) => void): void {
  if (!id) { update({ theme: 'sparow-dark', caretStyle: 'line', smoothCaret: true }); savePracticeStyle(ownerId, { keycaps: 'classic' }); return; }
  const item = COSMETICS.find(cosmetic => cosmetic.id === id); if (!item) return;
  if (item.category === 'theme') update({ theme: id === 'theme-aurora' ? 'aurora' : 'rose' });
  else if (item.category === 'caret') update({ caretStyle: 'line', smoothCaret: true });
  else if (item.category === 'keycap') savePracticeStyle(ownerId, { keycaps: 'outline' });
}
