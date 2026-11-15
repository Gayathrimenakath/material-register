import { Button, Group, Select } from '@mantine/core'
import { MATERIAL_STATUSES, MATERIAL_TYPES } from '../../api/materials.ts'
import type { Plant } from '../../api/plants.ts'

export type FilterName = 'type' | 'status' | 'plantId'

type Props = {
  type: string | undefined
  status: string | undefined
  plantId: number | undefined
  plants: Plant[]
  plantsFailed: boolean
  canClear: boolean // true when a search or any filter is active
  onChange: (name: FilterName, value: string | null) => void
  onClear: () => void
}

export default function MaterialsFilters({
  type,
  status,
  plantId,
  plants,
  plantsFailed,
  canClear,
  onChange,
  onClear,
}: Props) {
  return (
    <Group gap="sm" align="flex-end">
      <Select
        aria-label="Filter by type"
        placeholder="All types"
        data={[...MATERIAL_TYPES]}
        value={type ?? null}
        onChange={(value) => onChange('type', value)}
        clearable
      />
      <Select
        aria-label="Filter by status"
        placeholder="All statuses"
        data={[...MATERIAL_STATUSES]}
        value={status ?? null}
        onChange={(value) => onChange('status', value)}
        clearable
      />
      <Select
        aria-label="Filter by plant"
        placeholder={plantsFailed ? 'Plants unavailable' : 'All plants'}
        data={plants.map((plant) => ({ value: String(plant.id), label: `${plant.code} · ${plant.name}` }))}
        value={plantId ? String(plantId) : null}
        onChange={(value) => onChange('plantId', value)}
        disabled={plantsFailed}
        clearable
      />
      {canClear && (
        <Button variant="subtle" onClick={onClear}>
          Clear all
        </Button>
      )}
    </Group>
  )
}
