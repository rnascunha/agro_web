export function array_to_hex_string(arr)
{
  return arr.reduce((acc, data) => acc + data.toString(16).padStart(2, '0'), '')
}
