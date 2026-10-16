/**
 * token-value.ts — `--slate-2` → `var(--slate-2)`, the only colour value the brand
 * board writes (§E19).
 *
 * INLINE `style` RATHER THAN A STYLESHEET, deliberately. The token name is DATA here
 * (sandbox-catalog.ts), so a class per token would be 40-odd near-identical rules for
 * guards f and g to police, edited every time a token is added. `var()` keeps the
 * no-raw-hex rule intact, which is what those guards protect.
 */
export const tokenValue = (token: string) => `var(${token})`;
