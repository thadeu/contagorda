/**
 * Compares words the way a person means them: case and accents set aside.
 *
 * In Portuguese the accent is the first thing to go when someone types quickly,
 * so anything that matches on what was typed has to fold it — searching "farmacia"
 * must find "Farmácia", and two categories spelled the same but for a tilde are
 * one category.
 */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
