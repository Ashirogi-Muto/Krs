/** CMS wording merged over the built-in defaults: a field is used only when it holds non-blank text. */
export function mergeTexts<T extends Record<string, Record<string, string>>>(doc: any, defaults: T): T {
  const out: any = {}
  for (const [group, defs] of Object.entries(defaults)) {
    out[group] = { ...defs }
    for (const k of Object.keys(defs)) {
      const v = doc?.[group]?.[k]
      if (typeof v === 'string' && v.trim()) out[group][k] = v
    }
  }
  return out as T
}
