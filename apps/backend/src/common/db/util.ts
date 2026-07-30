export function enumToCheckList(enumRef: Record<string, string>): string {
  return Object.values(enumRef)
    .map((v) => `'${v}'`)
    .join(', ');
}
