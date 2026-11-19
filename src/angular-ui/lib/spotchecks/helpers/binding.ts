import { captureP1Error } from './sentry';
import { execute, hasFunction } from './executables';

export interface SchemaNode {
  type?: string;
  props?: Record<string, any>;
  children?: SchemaNode[];
  if?: any;
  slot?: string;
  meta?: { componentRole?: string; [key: string]: unknown };
  content?: any;
}

export interface SlotContent {
  schema: SchemaNode | null;
  context: BuilderContext;
}

export interface BuilderContext {
  state?: any;
  styles?: any;
  slots?: Record<string, SlotContent>;
  handlers?: Record<string, (...args: any[]) => void>;
}

// Same binding rules as the other SDKs' Builder.
const evaluateExpression = (expr: string, context: BuilderContext): any => {
  try {
    const safeContext = { state: context.state, styles: context.styles, Math };
    const func = new Function(...Object.keys(safeContext), `return ${expr}`);
    return func(...Object.values(safeContext));
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', {
      action: 'evaluateExpression',
      expression: expr?.substring(0, 200),
      errorMessage: error?.message,
    });
    return undefined;
  }
};

const readPath = (root: any, path: string) => {
  let result = root;
  for (const key of path.split('.')) result = result?.[key];
  return result;
};

export const resolveBinding = (value: any, context: BuilderContext): any => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => resolveBinding(item, context));

  if (value.$expr) return evaluateExpression(value.$expr, context);
  if (value.$ref) return readPath(context, value.$ref);
  if (value.$path) return readPath(context.state, value.$path);
  if (value.$handler && context.handlers) return context.handlers[value.$handler];

  // Generic action: `{ $execute: 'group.fn', args: {...} }` runs a backend function; unknown names do nothing.
  if (typeof value.$execute === 'string') {
    const functionName = value.$execute;
    const args = value.args && typeof value.args === 'object' ? value.args : {};
    return (event?: any) => {
      if (!functionName || !hasFunction(functionName)) return;
      const nativeEvent = event?.nativeEvent;
      const eventData = nativeEvent && typeof nativeEvent === 'object' ? { ...nativeEvent } : undefined;
      execute(functionName, eventData ? { ...args, event: eventData } : { ...args }).catch(() => {});
    };
  }

  if (Array.isArray(value.$handlers) && context.handlers) {
    return (...args: any[]) => {
      value.$handlers.forEach((name: string) => context.handlers?.[name]?.(...args));
    };
  }

  const resolved: Record<string, any> = {};
  for (const key in value) resolved[key] = resolveBinding(value[key], context);
  return resolved;
};

const pair = (cond: any, op: string, context: BuilderContext) =>
  cond[op].map((val: any) => resolveBinding(val, context));

export const evaluateCondition = (condition: any, context: BuilderContext): boolean => {
  if (!condition) return true;

  if (typeof condition === 'object' && !Array.isArray(condition)) {
    if (Array.isArray(condition.$and)) return condition.$and.every((c: any) => evaluateCondition(c, context));
    if (Array.isArray(condition.$or)) return condition.$or.some((c: any) => evaluateCondition(c, context));
    if (condition.$not !== undefined) return !evaluateCondition(condition.$not, context);
    if (Array.isArray(condition.$eq) && condition.$eq.length === 2) {
      const [l, r] = pair(condition, '$eq', context);
      return l === r;
    }
    if (Array.isArray(condition.$ne) && condition.$ne.length === 2) {
      const [l, r] = pair(condition, '$ne', context);
      return l !== r;
    }
    if (Array.isArray(condition.$gt) && condition.$gt.length === 2) {
      const [l, r] = pair(condition, '$gt', context);
      return l > r;
    }
    if (Array.isArray(condition.$lt) && condition.$lt.length === 2) {
      const [l, r] = pair(condition, '$lt', context);
      return l < r;
    }
  }

  return Boolean(resolveBinding(condition, context));
};

// CSS properties that take plain numbers; every other number is px.
const UNITLESS = new Set([
  'opacity', 'zIndex', 'flex', 'flexGrow', 'flexShrink', 'fontWeight', 'order', 'aspectRatio', 'scale',
]);

// Backend styles are CSS objects with camelCase keys.
export const toCss = (style: any): Record<string, string> | null => {
  if (!style || typeof style !== 'object' || Array.isArray(style)) return null;
  const css: Record<string, string> = {};
  for (const key of Object.keys(style)) {
    const value = style[key];
    if (value == null || typeof value === 'object') continue;
    css[key] = typeof value === 'number' && !UNITLESS.has(key) ? `${value}px` : String(value);
  }
  return css;
};
