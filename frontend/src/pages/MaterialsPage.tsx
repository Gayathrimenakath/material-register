import { Alert, Box, Button, Container, Group, LoadingOverlay, Pagination, Stack, Text, Title } from '@mantine/core'
import { useSearchParams } from 'react-router'
import MaterialsFilters, { type FilterName } from '../components/materials/MaterialsFilters.tsx'
import MaterialsSearch from '../components/materials/MaterialsSearch.tsx'
import MaterialsTable from '../components/materials/MaterialsTable.tsx'
import { MATERIAL_STATUSES, MATERIAL_TYPES } from '../api/materials.ts'
import { useMaterials } from '../hooks/useMaterials.ts'
import { usePlants } from '../hooks/usePlants.ts'

const PAGE_SIZE = 25

// The URL is the source of truth: /?page=3. Anything invalid falls back to 1.
function parsePage(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return 1 // rejects "2abc", "-1", "1.5"
  return Math.max(1, Number(value))
}

// Returns the URL value only if it is one of the allowed options, else undefined.
function parseOption<T extends string>(value: string | null, options: readonly T[]) {
  return options.find((option) => option === value)
}

function parsePlantId(value: string | null) {
  return value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : undefined
}

export default function MaterialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('search') ?? ''
  const type = parseOption(searchParams.get('type'), MATERIAL_TYPES)
  const status = parseOption(searchParams.get('status'), MATERIAL_STATUSES)
  const plantId = parsePlantId(searchParams.get('plantId'))
  const hasActiveFilters = Boolean(search || type || status || plantId)

  const { data, loading, error, retry } = useMaterials({
    page,
    pageSize: PAGE_SIZE,
    search,
    type,
    status,
    plantId,
  })
  const { plants, failed: plantsFailed } = usePlants()

  const setPage = (newPage: number) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous) // keep any other params
      if (newPage === 1) next.delete('page')
      else next.set('page', String(newPage))
      return next
    })

  // Sets or removes URL params. Any change to search or filters goes back to page 1.
  const setParams = (updates: Record<string, string | undefined>) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      next.delete('page')
      return next
    })

  const clearAll = () =>
    setParams({ search: undefined, type: undefined, status: undefined, plantId: undefined })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const shownPage = data?.page ?? page
  const from = (shownPage - 1) * PAGE_SIZE + 1
  const to = Math.min(shownPage * PAGE_SIZE, total)

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Title order={2}>Material Register</Title>

        <MaterialsSearch value={search} onChange={(value) => setParams({ search: value })} />
        <MaterialsFilters
          type={type}
          status={status}
          plantId={plantId}
          plants={plants}
          plantsFailed={plantsFailed}
          canClear={hasActiveFilters}
          onChange={(name: FilterName, value) => setParams({ [name]: value ?? undefined })}
          onClear={clearAll}
        />

        {error && (
          <Alert color="red" title="Could not load materials">
            <Group justify="space-between">
              <Text size="sm">{error}</Text>
              <Button size="xs" variant="light" color="red" onClick={retry}>
                Try again
              </Button>
            </Group>
          </Alert>
        )}

        <Box pos="relative" mih={200}>
          <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />

          {data && !error && data.items.length > 0 && <MaterialsTable items={data.items} />}

          {data && !error && data.items.length === 0 && (
            <Stack align="center" py="xl" gap="xs">
              <Text fw={500}>
                {total > 0
                  ? 'This page is out of range'
                  : hasActiveFilters
                    ? 'No materials match the current search or filters'
                    : 'No materials found'}
              </Text>
              {total > 0 && (
                <Button variant="light" onClick={() => setPage(1)}>
                  Go to first page
                </Button>
              )}
              {total === 0 && hasActiveFilters && (
                <Button variant="light" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {data && !error && data.items.length > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
            </Text>
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Stack>
    </Container>
  )
}
