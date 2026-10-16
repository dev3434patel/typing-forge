import { describe, expect, it } from 'vitest';
import { getRandomQuote, quotes, type QuoteLength } from '../quotes';

describe('original quote lengths and reproducible passage identity', () => {
  for (const [length,count] of [['short',1],['medium',2],['long',4]] as const) {
    it(`${length} selects ${count} complete authored passages deterministically`, () => {
      const selected=getRandomQuote('fixed',length);
      expect(getRandomQuote('fixed',length)).toEqual(selected);
      const first=getRandomQuote('fixed');
      const start=quotes.indexOf(first);
      expect(selected.text).toBe(Array.from({length:count},(_,offset)=>quotes[(start+offset)%quotes.length].text).join(' '));
      expect(selected).toMatchObject({author:'SparowType',license:'CC0-1.0'});
      expect(selected.source).toContain('Original SparowType');
      expect(selected.revision).toBeTruthy();
      if(length==='short')expect(selected).toBe(first);
      else expect(selected.category).toBe('mixed');
    });
  }
  it('keeps every selection nonempty, distinct by length and honest at wraparound', () => {
    const identities=new Set<string>();
    for(let seed=65;seed<65+quotes.length;seed++){
      const textSeed=String.fromCodePoint(seed);
      for(const length of ['short','medium','long'] as const){
        const selected=getRandomQuote(textSeed,length);
        expect(selected.text.trim().length).toBeGreaterThan(50);
        expect(selected.text).not.toContain('undefined');
        expect(selected.text).toBe(selected.text.normalize('NFC'));
        identities.add(selected.id);
      }
    }
    expect(identities.size).toBe(quotes.length*3);
  });
  it('safely falls back to a short passage for an unknown stored length', () => {
    expect(getRandomQuote('same','invalid' as QuoteLength)).toEqual(getRandomQuote('same','short'));
  });
});
