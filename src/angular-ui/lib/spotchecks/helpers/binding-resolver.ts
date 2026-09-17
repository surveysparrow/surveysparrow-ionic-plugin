import type { BuilderContext } from '../components/builder-context';

import { captureP1Error } from './sentry';

export interface SchemaNode {
  type: string;
  props?: Record<string, unknown>;
  children?: SchemaNode[];
  if?: unknown;
  slot?: string;
  content?: unknown;
  meta?: { componentRole?: string; [key: string]: unknown };
  animation?: Record<string, unknown>;
}

export function evaluateExpression(expr: string, context: BuilderContext): unknown {
  try {
    const safeContext: Record<string, unknown> = {
      state: context.state,
      styles: context.styles,
      Math,
    };
    if (typeof context.screenHeight === 'number') {
      safeContext['screenHeight'] = context.screenHeight;
    }
    if (typeof context.screenWidth === 'number') {
      safeContext['screenWidth'] = context.screenWidth;
    }
    const func = new Function(
      ...Object.keys(safeContext),
      `return ${expr}`
    );
    return func(...Object.values(safeContext));
  } catch (error: unknown) {
    captureP1Error(error, 'GENERAL', {
      action: 'evaluateExpression',
      expression: String(expr).substring(0, 200),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    if (String(expr).includes('translateY')) return 0;
    if (String(expr).includes('scale')) return 1;
    if (String(expr).includes('opacity')) return 1;
    return undefined;
  }
}

export function resolveBinding(value: unknown, context: BuilderContext): unknown {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item) => resolveBinding(item, context));
    }
    const v = value as Record<string, unknown>;
    if (v['$expr']) {
      return evaluateExpression(String(v['$expr']), context);
    }
    if (v['$ref']) {
      const path = String(v['$ref']).split('.');
      let result: unknown = context;
      for (const key of path) {
        result = (result as Record<string, unknown>)?.[key];
      }
      return result;
    }
    if (v['$path']) {
      const path = String(v['$path']).split('.');
      let result: unknown = context.state;
      for (const key of path) {
        result = (result as Record<string, unknown>)?.[key];
      }
      return result;
    }
    if (v['$handler'] && context.handlers) {
      return context.handlers[String(v['$handler'])];
    }
    if (v['$handlers'] && Array.isArray(v['$handlers']) && context.handlers) {
      return (...args: unknown[]) => {
        (v['$handlers'] as string[]).forEach((handlerName) => {
          const handler = context.handlers?.[handlerName];
          if (handler) handler(...args);
        });
      };
    }
    const resolved: Record<string, unknown> = {};
    for (const key in v) {
      if (Object.prototype.hasOwnProperty.call(v, key)) {
        resolved[key] = resolveBinding(v[key], context);
      }
    }
    return resolved;
  }
  return value;
}

export function evaluateCondition(condition: unknown, context: BuilderContext): boolean {
  if (!condition) return true;
  if (typeof condition === 'object' && !Array.isArray(condition)) {
    const c = condition as Record<string, unknown>;
    if (c['$and'] && Array.isArray(c['$and'])) {
      return c['$and'].every((cond) => evaluateCondition(cond, context));
    }
    if (c['$or'] && Array.isArray(c['$or'])) {
      return c['$or'].some((cond) => evaluateCondition(cond, context));
    }
    if (c['$not'] !== undefined) {
      return !evaluateCondition(c['$not'], context);
    }
    if (c['$eq'] && Array.isArray(c['$eq']) && c['$eq'].length === 2) {
      const [left, right] = c['$eq'].map((val) => resolveBinding(val, context));
      return left === right;
    }
    if (c['$ne'] && Array.isArray(c['$ne']) && c['$ne'].length === 2) {
      const [left, right] = c['$ne'].map((val) => resolveBinding(val, context));
      return left !== right;
    }
    if (c['$gt'] && Array.isArray(c['$gt']) && c['$gt'].length === 2) {
      const [left, right] = c['$gt'].map((val) => resolveBinding(val, context));
      return (left as number) > (right as number);
    }
    if (c['$lt'] && Array.isArray(c['$lt']) && c['$lt'].length === 2) {
      const [left, right] = c['$lt'].map((val) => resolveBinding(val, context));
      return (left as number) < (right as number);
    }
  }
  const resolved = resolveBinding(condition, context);
  return Boolean(resolved);
}
