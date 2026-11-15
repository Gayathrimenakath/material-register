export type Material = {
  id: number
  materialNumber: string
  description: string
  type: string
  status: string
  manufacturer: string | null
  manufacturerPartNumber: string | null
  unitOfMeasure: string
  unitPrice: number
  stockQuantity: number
  createdAt: string
  updatedAt: string
  plant: { id: number; code: string; name: string }
}

export type MaterialsResponse = {
  items: Material[]
  total: number
  page: number
  pageSize: number
}

export type MaterialsParams = {
  page: number
  pageSize: number
}

export async function fetchMaterials(
  params: MaterialsParams,
  signal?: AbortSignal,
): Promise<MaterialsResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  const response = await fetch(`/api/materials?${query}`, { signal })

  if (!response.ok) {
    // The API answers errors as { error: { message } }.
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`)
  }
  return response.json()
}
