/**
 * Levenshtein distance between two strings.
 */
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Find the closest match for `input` among `candidates`.
 * Returns suggestions with distance <= maxDistance, sorted by closeness.
 */
export function closestMatches(input: string, candidates: string[], maxDistance = 3): string[] {
  return candidates
    .map(c => ({ name: c, dist: distance(input.toLowerCase(), c.toLowerCase()) }))
    .filter(c => c.dist <= maxDistance && c.dist > 0)
    .sort((a, b) => a.dist - b.dist)
    .map(c => c.name);
}
