import type { TemplateRef } from '@angular/core';
import type { SpotCheckRootState } from '../state/spotcheck-store';

export interface BuilderContext {
  state: SpotCheckRootState;
  styles?: Record<string, unknown>;
  /** Named TemplateRefs for schema slots (e.g. wrapper `children` → WebView). */
  slots?: Record<string, TemplateRef<unknown> | null>;
  handlers?: Record<string, (...args: unknown[]) => void>;
  screenHeight?: number;
  screenWidth?: number;
}
