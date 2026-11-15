import { Group, Table, Text, UnstyledButton } from '@mantine/core'
import { useTable } from '@tanstack/react-table'
import { useMemo } from 'react'
import { SORTABLE_COLUMNS, type Material, type SortableColumn, type SortOrder } from '../../api/materials.ts'
import { features, materialColumns } from './materialColumns.tsx'

type Props = {
  items: Material[]
  sortBy: SortableColumn
  sortOrder: SortOrder
  onSortChange: (sortBy: SortableColumn, sortOrder: SortOrder) => void
}

export default function MaterialsTable({ items, sortBy, sortOrder, onSortChange }: Props) {
  // Memoized so the table sees a new array only when the sort really changes.
  const sorting = useMemo(() => [{ id: sortBy, desc: sortOrder === 'desc' }], [sortBy, sortOrder])

  const table = useTable(
    {
      features,
      columns: materialColumns,
      data: items,
      manualSorting: true, // the database sorts, not the table
      enableSortingRemoval: false, // there is always a sort (the default one)
      enableMultiSort: false,
      sortDescFirst: false, // first click is always ascending, even for numbers
      state: { sorting },
      onSortingChange: (updater) => {
        const next = (typeof updater === 'function' ? updater(sorting) : updater)[0]
        const column = SORTABLE_COLUMNS.find((id) => id === next?.id)
        if (column) onSortChange(column, next.desc ? 'desc' : 'asc')
      },
    },
    (state) => state,
  )

  return (
    <Table.ScrollContainer minWidth={1000}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <Table.Th
                    key={header.id}
                    aria-sort={
                      sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <UnstyledButton
                        onClick={header.column.getToggleSortingHandler()}
                        fw="inherit"
                        fz="inherit"
                      >
                        <Group gap={4} wrap="nowrap">
                          <table.FlexRender header={header} />
                          <Text span size="xs" c={sorted ? undefined : 'dimmed'}>
                            {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </Table.Th>
                )
              })}
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
