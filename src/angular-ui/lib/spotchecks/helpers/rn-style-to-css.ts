/**
 * Converts React Native-like style objects from backend into CSS for DOM.
 */
export function rnStyleToCss(
  style: Record<string, unknown> | null | undefined
): Record<string, string | number> {
  if (!style || typeof style !== 'object') return {};
  const out: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(style)) {
    if (val === null || val === undefined) continue;
    if (key === 'transform' && Array.isArray(val)) {
      const parts: string[] = [];
      for (const t of val as Record<string, number>[]) {
        if (t['translateX'] !== undefined) {
          parts.push(`translateX(${num(t['translateX'])}px)`);
        }
        if (t['translateY'] !== undefined) {
          parts.push(`translateY(${num(t['translateY'])}px)`);
        }
        if (t['scale'] !== undefined) {
          parts.push(`scale(${t['scale']})`);
        }
        if (t['rotate'] !== undefined) {
          parts.push(`rotate(${t['rotate']})`);
        }
      }
      if (parts.length) {
        out['transform'] = parts.join(' ');
      }
      continue;
    }
    if (key === 'shadowColor' || key === 'shadowOffset' || key === 'shadowOpacity' || key === 'shadowRadius') {
      continue;
    }
    if (key === 'elevation') continue;
    if (key === 'flex' && typeof val === 'number') {
      out['flex'] = val;
      continue;
    }
    const cssKey = camelToKebab(key);
    if (key === 'backgroundColor') {
      out['background-color'] = val as string;
      continue;
    }
    if (typeof val === 'number' && isSizeKey(key)) {
      out[cssKey] = `${val}px`;
    } else if (typeof val === 'string' && (val.endsWith('%') || val === '100%')) {
      out[cssKey] = val;
    } else {
      out[cssKey] = val as string | number;
    }
  }
  return out;
}

function num(n: unknown): number {
  return typeof n === 'number' ? n : Number(n) || 0;
}

function isSizeKey(key: string): boolean {
  return [
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'fontSize',
    'lineHeight',
    'borderRadius',
    'borderWidth',
  ].includes(key);
}

function camelToKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function mergeRnStyles(
  ...styles: (Record<string, unknown> | null | undefined)[]
): Record<string, string | number> {
  const merged: Record<string, unknown> = {};
  for (const s of styles) {
    if (!s) continue;
    Object.assign(merged, s);
  }
  return rnStyleToCss(merged);
}
