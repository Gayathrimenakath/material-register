import { useEffect, useState } from 'react'
import { fetchPlants, type Plant } from '../api/plants.ts'

// The plant list is small and rarely changes, so it is fetched once.
export function usePlants() {
  const [state, setState] = useState<{ plants: Plant[]; failed: boolean }>({
    plants: [],
    failed: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    fetchPlants(controller.signal)
      .then((plants) => setState({ plants, failed: false }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ plants: [], failed: true })
      })
    return () => controller.abort()
  }, [])

  return state
}
