/** At most eight units can be admitted. Stop as soon as a second bijection exists. */
export function uniqueAssignment(edges: boolean[][]): number[] | null {
  if (edges.length > 8 || edges.some((row) => row.length !== edges.length))
    return null;
  const order = edges
    .map((_, i) => i)
    .sort(
      (a, b) =>
        edges[a]!.filter(Boolean).length - edges[b]!.filter(Boolean).length,
    );
  const current = Array<number>(edges.length).fill(-1);
  const used = new Set<number>();
  let solution: number[] | null = null;
  let count = 0;
  function visit(depth: number) {
    if (count > 1) return;
    if (depth === order.length) {
      solution = [...current];
      count++;
      return;
    }
    const row = order[depth]!;
    for (let column = 0; column < edges.length; column++) {
      if (!edges[row]![column] || used.has(column)) continue;
      current[row] = column;
      used.add(column);
      visit(depth + 1);
      used.delete(column);
    }
  }
  visit(0);
  return count === 1 ? solution : null;
}
