import { Badge } from '@mantine/core'
import { createColumnHelper, tableFeatures } from '@tanstack/react-table'
import type { Material } from '../../api/materials.ts'

export const features = tableFeatures({})

const columnHelper = createColumnHelper<typeof features, Material>()

const priceFormat = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
const dateFormat = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' })

const statusColor: Record<string, string> = {
  Active: 'green',
  Obsolete: 'gray',
  'Pending Review': 'yellow',
}

export const materialColumns = columnHelper.columns([
  columnHelper.accessor('materialNumber', { header: 'Material no.' }),
  columnHelper.accessor('description', { header: 'Description' }),
  columnHelper.accessor('type', { header: 'Type' }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge color={statusColor[info.getValue()] ?? 'gray'} variant="light">
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('manufacturer', {
    header: 'Manufacturer',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor('manufacturerPartNumber', {
    header: 'MPN',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor((row) => `${row.plant.code} · ${row.plant.name}`, {
    id: 'plant',
    header: 'Plant',
  }),
  columnHelper.accessor('unitOfMeasure', { header: 'UoM' }),
  columnHelper.accessor('unitPrice', {
    header: 'Unit price',
    cell: (info) => priceFormat.format(info.getValue()),
  }),
  columnHelper.accessor('stockQuantity', { header: 'Stock' }),
  columnHelper.accessor('updatedAt', {
    header: 'Last updated',
    cell: (info) => dateFormat.format(new Date(info.getValue())),
  }),
])
