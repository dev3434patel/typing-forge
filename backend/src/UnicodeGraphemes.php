<?php
declare(strict_types=1);
namespace SparowType;

/** Unicode15.1 GB9c data; https://www.unicode.org/Public/15.1.0/ucd/DerivedCoreProperties.txt
 * Consonant/Linker/Extend ranges generated from InCB, not general script or mark guesses.
 * https://www.unicode.org/license.txt
 */
final class UnicodeGraphemes
{
    private const CONSONANT = '[\x{0915}-\x{0939}\x{0958}-\x{095F}\x{0978}-\x{097F}\x{0995}-\x{09A8}\x{09AA}-\x{09B0}\x{09B2}\x{09B6}-\x{09B9}\x{09DC}-\x{09DD}\x{09DF}\x{09F0}-\x{09F1}\x{0A95}-\x{0AA8}\x{0AAA}-\x{0AB0}\x{0AB2}-\x{0AB3}\x{0AB5}-\x{0AB9}\x{0AF9}\x{0B15}-\x{0B28}\x{0B2A}-\x{0B30}\x{0B32}-\x{0B33}\x{0B35}-\x{0B39}\x{0B5C}-\x{0B5D}\x{0B5F}\x{0B71}\x{0C15}-\x{0C28}\x{0C2A}-\x{0C39}\x{0C58}-\x{0C5A}\x{0D15}-\x{0D3A}]';
    private const LINKER = '[\x{094D}\x{09CD}\x{0ACD}\x{0B4D}\x{0C4D}\x{0D4D}]';
    private const EXTEND = '[\x{0300}-\x{034E}\x{0350}-\x{036F}\x{0483}-\x{0487}\x{0591}-\x{05BD}\x{05BF}\x{05C1}-\x{05C2}\x{05C4}-\x{05C5}\x{05C7}\x{0610}-\x{061A}\x{064B}-\x{065F}\x{0670}\x{06D6}-\x{06DC}\x{06DF}-\x{06E4}\x{06E7}-\x{06E8}\x{06EA}-\x{06ED}\x{0711}\x{0730}-\x{074A}\x{07EB}-\x{07F3}\x{07FD}\x{0816}-\x{0819}\x{081B}-\x{0823}\x{0825}-\x{0827}\x{0829}-\x{082D}\x{0859}-\x{085B}\x{0898}-\x{089F}\x{08CA}-\x{08E1}\x{08E3}-\x{08FF}\x{093C}\x{0951}-\x{0954}\x{09BC}\x{09FE}\x{0A3C}\x{0ABC}\x{0B3C}\x{0C3C}\x{0C55}-\x{0C56}\x{0CBC}\x{0D3B}-\x{0D3C}\x{0E38}-\x{0E3A}\x{0E48}-\x{0E4B}\x{0EB8}-\x{0EBA}\x{0EC8}-\x{0ECB}\x{0F18}-\x{0F19}\x{0F35}\x{0F37}\x{0F39}\x{0F71}-\x{0F72}\x{0F74}\x{0F7A}-\x{0F7D}\x{0F80}\x{0F82}-\x{0F84}\x{0F86}-\x{0F87}\x{0FC6}\x{1037}\x{1039}-\x{103A}\x{108D}\x{135D}-\x{135F}\x{1714}\x{17D2}\x{17DD}\x{18A9}\x{1939}-\x{193B}\x{1A17}-\x{1A18}\x{1A60}\x{1A75}-\x{1A7C}\x{1A7F}\x{1AB0}-\x{1ABD}\x{1ABF}-\x{1ACE}\x{1B34}\x{1B6B}-\x{1B73}\x{1BAB}\x{1BE6}\x{1C37}\x{1CD0}-\x{1CD2}\x{1CD4}-\x{1CE0}\x{1CE2}-\x{1CE8}\x{1CED}\x{1CF4}\x{1CF8}-\x{1CF9}\x{1DC0}-\x{1DFF}\x{200D}\x{20D0}-\x{20DC}\x{20E1}\x{20E5}-\x{20F0}\x{2CEF}-\x{2CF1}\x{2D7F}\x{2DE0}-\x{2DFF}\x{302A}-\x{302D}\x{302E}-\x{302F}\x{3099}-\x{309A}\x{A66F}\x{A674}-\x{A67D}\x{A69E}-\x{A69F}\x{A6F0}-\x{A6F1}\x{A82C}\x{A8E0}-\x{A8F1}\x{A92B}-\x{A92D}\x{A9B3}\x{AAB0}\x{AAB2}-\x{AAB4}\x{AAB7}-\x{AAB8}\x{AABE}-\x{AABF}\x{AAC1}\x{AAF6}\x{ABED}\x{FB1E}\x{FE20}-\x{FE2F}\x{101FD}\x{102E0}\x{10376}-\x{1037A}\x{10A0D}\x{10A0F}\x{10A38}-\x{10A3A}\x{10A3F}\x{10AE5}-\x{10AE6}\x{10D24}-\x{10D27}\x{10EAB}-\x{10EAC}\x{10EFD}-\x{10EFF}\x{10F46}-\x{10F50}\x{10F82}-\x{10F85}\x{11070}\x{1107F}\x{110BA}\x{11100}-\x{11102}\x{11133}-\x{11134}\x{11173}\x{111CA}\x{11236}\x{112E9}-\x{112EA}\x{1133B}-\x{1133C}\x{11366}-\x{1136C}\x{11370}-\x{11374}\x{11446}\x{1145E}\x{114C3}\x{115C0}\x{116B7}\x{1172B}\x{1183A}\x{1193E}\x{11943}\x{11A34}\x{11A47}\x{11A99}\x{11D42}\x{11D44}-\x{11D45}\x{11D97}\x{11F42}\x{16AF0}-\x{16AF4}\x{16B30}-\x{16B36}\x{1BC9E}\x{1D165}\x{1D167}-\x{1D169}\x{1D16E}-\x{1D172}\x{1D17B}-\x{1D182}\x{1D185}-\x{1D18B}\x{1D1AA}-\x{1D1AD}\x{1D242}-\x{1D244}\x{1E000}-\x{1E006}\x{1E008}-\x{1E018}\x{1E01B}-\x{1E021}\x{1E023}-\x{1E024}\x{1E026}-\x{1E02A}\x{1E08F}\x{1E130}-\x{1E136}\x{1E2AE}\x{1E2EC}-\x{1E2EF}\x{1E4EC}-\x{1E4EF}\x{1E8D0}-\x{1E8D6}\x{1E944}-\x{1E94A}]';
    public static function joinsIndicConjunct(string $previous, string $next): bool
    {
        return (bool)preg_match('/' . self::CONSONANT . '(?:' . self::EXTEND . '|' . self::LINKER . ')*' . self::LINKER . '(?:' . self::EXTEND . '|' . self::LINKER . ')*$/u', $previous)
            && (bool)preg_match('/^' . self::CONSONANT . '/u', $next);
    }
}
