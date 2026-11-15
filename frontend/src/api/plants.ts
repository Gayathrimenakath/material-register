export type Plant = { id: number; code: string; name: string }

export async function fetchPlants(signal?: AbortSignal): Promise<Plant[]> {
  const response = await fetch('/api/plants', { signal })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json()
}
