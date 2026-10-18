/**
 * Entry options of a competition (owner, 18 Oct 2026: BGMI Solo ₹99 / Squad ₹199 of 1–4 players; coupons never for Solo).
 * CMS → Events → Registration & fee → "Entry options". Each option has its own fee, team size and "Coupon codes allowed"
 * switch; the form asks for one, the server enforces it (fee, team size) and checkout enforces the coupon switch.
 * Pure rules, unit-tested (tests/entry-options.test.ts). No options = the competition's own fee and team size, as before.
 */
export type EntryOption = { name: string; fee: number; feeSuffix?: string; minTeam: number; maxTeam: number; couponsAllowed: boolean }

/** The usable options from the CMS rows (incomplete rows are skipped, never half-shown). */
export function entryOptionsOf(rows: unknown): EntryOption[] {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((r: any) => {
    const name = String(r?.name || '').trim()
    const fee = Number(r?.fee)
    const minTeam = Number(r?.minTeamSize)
    const maxTeam = Number(r?.maxTeamSize)
    if (!name || !Number.isFinite(fee) || fee < 0 || !Number.isInteger(minTeam) || minTeam < 1 || !Number.isInteger(maxTeam) || maxTeam < minTeam) return []
    return [{ name, fee, feeSuffix: String(r?.feeSuffix || '') || undefined, minTeam, maxTeam, couponsAllowed: r?.couponsAllowed !== false }]
  })
}

/** The option a team chose (exact name), or null. */
export const pickOption = (options: EntryOption[], name: unknown) => options.find((o) => o.name === String(name ?? '').trim()) || null

/**
 * May this team use a coupon? Competitions without options: yes (as before). With options: only when the team's option
 * allows coupons; an unknown or missing option is refused (fail closed, e.g. after an option was renamed).
 */
export function couponAllowedFor(options: EntryOption[], entryName: unknown): boolean {
  if (!options.length) return true
  return Boolean(pickOption(options, entryName)?.couponsAllowed)
}

/** The fee a coupon offer is shown against: the first option that allows coupons (null = no option does). */
export function couponFee(options: EntryOption[], fallback: number | null): number | null {
  if (!options.length) return fallback
  return options.find((o) => o.couponsAllowed)?.fee ?? null
}
