import { Alert, Box, Button, Container, Group, LoadingOverlay, Pagination, Stack, Text, Title } from '@mantine/core'
import { useSearchParams } from 'react-router'
import MaterialsSearch from '../components/materials/MaterialsSearch.tsx'
import MaterialsTable from '../components/materials/MaterialsTable.tsx'
import { useMaterials } from '../hooks/useMaterials.ts'

const PAGE_SIZE = 25

// The URL is the source of truth: /?page=3. Anything invalid falls back to 1.
function parsePage(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return 1 // rejects "2abc", "-1", "1.5"
  return Math.max(1, Number(value))
}

export default function MaterialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('search') ?? ''
  const { data, loading, error, retry } = useMaterials({ page, pageSize: PAGE_SIZE, search })

  const setPage = (newPage: number) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous) // keep any other params
      if (newPage === 1) next.delete('page')
      else next.set('page', String(newPage))
      return next
    })

  // Changing the search always goes back to page 1.
  const setSearch = (value: string) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value) next.set('search', value)
      else next.delete('search')
      next.delete('page')
      return next
    })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const shownPage = data?.page ?? page
  const from = (shownPage - 1) * PAGE_SIZE + 1
  const to = Math.min(shownPage * PAGE_SIZE, total)

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Title order={2}>Material Register</Title>

        <MaterialsSearch value={search} onChange={setSearch} />

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
                  : search
                    ? `No materials match "${search}"`
                    : 'No materials found'}
              </Text>
              {total > 0 && (
                <Button variant="light" onClick={() => setPage(1)}>
                  Go to first page
                </Button>
              )}
              {total === 0 && search && (
                <Button variant="light" onClick={() => setSearch('')}>
                  Clear search
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
