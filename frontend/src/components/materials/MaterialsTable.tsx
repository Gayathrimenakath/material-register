import { Table } from '@mantine/core'
import { useTable } from '@tanstack/react-table'
import type { Material } from '../../api/materials.ts'
import { features, materialColumns } from './materialColumns.tsx'

export default function MaterialsTable({ items }: { items: Material[] }) {
  const table = useTable({ features, columns: materialColumns, data: items }, (state) => state)

  return (
    <Table.ScrollContainer minWidth={1000}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Th key={header.id}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <Table.Td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
