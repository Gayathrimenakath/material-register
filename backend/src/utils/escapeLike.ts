// In LIKE patterns, % and _ are wildcards. Escape them (and the escape character
// itself, backslash) so a search for "50%" matches the literal text.
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
