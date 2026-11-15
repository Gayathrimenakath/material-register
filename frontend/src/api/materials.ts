// Keep in sync with the enums in backend/src/db/schema.ts. The API validates
// every value, so a mismatch shows up as a 400 error instead of wrong data.
export const MATERIAL_TYPES = ['Spare Part', 'Consumable', 'Raw Material', 'Tool'] as const
export const MATERIAL_STATUSES = ['Active', 'Obsolete', 'Pending Review'] as const

export type MaterialType = (typeof MATERIAL_TYPES)[number]
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number]

export type Material = {
  id: number
  materialNumber: string
  description: string
  type: MaterialType
  status: MaterialStatus
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
  search?: string
  type?: MaterialType
  status?: MaterialStatus
  plantId?: number
}

export async function fetchMaterials(
  params: MaterialsParams,
  signal?: AbortSignal,
): Promise<MaterialsResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  if (params.search) query.set('search', params.search)
  if (params.type) query.set('type', params.type)
  if (params.status) query.set('status', params.status)
  if (params.plantId) query.set('plantId', String(params.plantId))
  const response = await fetch(`/api/materials?${query}`, { signal })

  if (!response.ok) {
    // The API answers errors as { error: { message } }.
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`)
  }
  return response.json()
}
