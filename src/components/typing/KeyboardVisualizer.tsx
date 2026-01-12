import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KeyboardVisualizerProps {
  currentKey?: string;
  errorKeys?: Set<string>;
  keyConfidence?: Map<string, number>;
}

// QWERTY keyboard layout
const KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', ' ', 'Alt', 'Ctrl'],
];

// Key widths relative to normal key (1 = 40px)
const KEY_WIDTHS: Record<string, number> = {
  'Backspace': 1.5,
  'Tab': 1.5,
  '\\': 1.5,
  'CapsLock': 1.75,
  'Enter': 2.25,
  'Shift': 2.25,
  'Ctrl': 1.25,
  'Alt': 1.25,
  ' ': 6.5,
};

// Home row markers
const HOME_ROW_KEYS = new Set(['f', 'j']);

// Get color based on confidence level
function getConfidenceColor(confidence: number): string {
  if (confidence >= 1.0) return 'hsl(142 50% 35%)'; // dark green - mastered
  if (confidence >= 0.8) return 'hsl(142 50% 45%)'; // light green - nearly there
  if (confidence >= 0.6) return 'hsl(48 80% 45%)'; // yellow - in progress
  if (confidence >= 0.3) return 'hsl(25 80% 50%)'; // orange - needs work
  return 'hsl(0 60% 50%)'; // red - weak
}

// Default confidence for demo visualization
function getDefaultConfidence(key: string): number {
  const common = 'etaoinshrdlcumwfgypbvkjxqz';
  const index = common.indexOf(key.toLowerCase());
  if (index === -1) return 0.5;
  return 1 - (index / common.length) * 0.7;
}

export function KeyboardVisualizer({ 
  currentKey, 
  errorKeys = new Set(), 
  keyConfidence 
}: KeyboardVisualizerProps) {
  // Calculate key colors based on confidence
  const keyColors = useMemo(() => {
    const colors = new Map<string, string>();
    
    KEYBOARD_ROWS.flat().forEach(key => {
      const lowerKey = key.toLowerCase();
      let confidence: number;
      
      if (keyConfidence && keyConfidence.has(lowerKey)) {
        confidence = keyConfidence.get(lowerKey)!;
      } else if (key.length === 1 && /[a-z]/i.test(key)) {
        confidence = getDefaultConfidence(key);
      } else {
        confidence = 0.5;
      }
      
      colors.set(lowerKey, getConfidenceColor(confidence));
    });
    
    return colors;
  }, [keyConfidence]);

  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="bg-muted/30 border border-border/50 rounded-xl p-4 md:p-6">
        <div className="flex flex-col items-center gap-1">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((key, keyIndex) => {
                const isCurrentKey = currentKey?.toLowerCase() === key.toLowerCase();
                const isErrorKey = errorKeys.has(key.toLowerCase());
                const isSpace = key === ' ';
                const isHomeRow = HOME_ROW_KEYS.has(key.toLowerCase());
                const width = KEY_WIDTHS[key] || 1;
                const baseSize = 40;
                const keyWidth = baseSize * width;
                const bgColor = keyColors.get(key.toLowerCase()) || 'hsl(var(--muted))';
                
                return (
                  <motion.div
                    key={`${rowIndex}-${keyIndex}`}
                    className={cn(
                      "relative flex items-center justify-center rounded-md border text-xs md:text-sm font-mono font-medium transition-all",
                      "h-9 md:h-10",
                      isSpace ? "bg-[hsl(0_50%_55%)]" : "",
                      isCurrentKey && "ring-2 ring-primary ring-offset-1 ring-offset-background z-10",
                      isErrorKey && "bg-destructive/50"
                    )}
                    style={{
                      width: `${keyWidth}px`,
                      backgroundColor: isSpace ? 'hsl(0 50% 55%)' : isErrorKey ? undefined : bgColor,
                      color: 'hsl(var(--foreground))',
                    }}
                    animate={isCurrentKey ? {
                      scale: [1, 1.1, 1],
                      transition: { duration: 0.15 }
                    } : {}}
                  >
                    {/* Key label */}
                    <span className={cn(
                      "select-none uppercase",
                      isSpace && "text-transparent"
                    )}>
                      {key.length > 1 ? (
                        <span className="text-[10px] md:text-xs">{key}</span>
                      ) : (
                        key
                      )}
                    </span>
                    
                    {/* Home row indicator */}
                    {isHomeRow && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground/60" />
                    )}
                    
                    {/* Current key highlight ring */}
                    {isCurrentKey && (
                      <motion.div
                        className="absolute inset-0 rounded-md border-2 border-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layoutId="keyboard-highlight"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142 50% 35%)' }} />
            <span>Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(48 80% 45%)' }} />
            <span>Learning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0 60% 50%)' }} />
            <span>Weak</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
