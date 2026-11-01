export function estimateCost(
  input: number,
  output: number,
  inputPerMillion = 0,
  outputPerMillion = 0,
) {
  return (input * inputPerMillion + output * outputPerMillion) / 1e6;
}
