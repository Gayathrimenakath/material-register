import { useEffect, useState } from 'react'
import { fetchMaterials, type MaterialsParams, type MaterialsResponse } from '../api/materials.ts'

type Result = { key: string; data: MaterialsResponse | null; error: string | null }

export function useMaterials({ page, pageSize, search, type, status, plantId }: MaterialsParams) {
  const [attempt, setAttempt] = useState(0) // bumped by retry() to refetch
  const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

  // Identifies the request we want. While `result.key` differs, we are loading.
  const key = JSON.stringify([page, pageSize, search, type, status, plantId, attempt])

  useEffect(() => {
    const controller = new AbortController()

    fetchMaterials({ page, pageSize, search, type, status, plantId }, controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return // superseded by a newer request
        const error = err instanceof Error ? err.message : 'Something went wrong'
        setResult((previous) => ({ key, data: previous.data, error }))
      })

    // If the page changes before this response arrives, cancel it so a slow
    // old response can never overwrite a newer one.
    return () => controller.abort()
  }, [key, page, pageSize, search, type, status, plantId])

  const isCurrent = result.key === key
  return {
    data: result.data, // keeps the previous page visible while the next one loads
    loading: !isCurrent,
    error: isCurrent ? result.error : null,
    retry: () => setAttempt((n) => n + 1),
  }
}
