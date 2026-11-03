export function matches(query: string, text: string) {
  const q = query.toLowerCase().replace(/\s/g, "");
  let i = 0;
  for (const c of text.toLowerCase()) if (c === q[i]) i++;
  return i === q.length;
}
