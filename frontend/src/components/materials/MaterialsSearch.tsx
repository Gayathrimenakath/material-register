import { CloseButton, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useEffect, useState } from 'react'

type Props = {
  value: string 
  onChange: (value: string) => void
}

const DEBOUNCE_MS = 400

export default function MaterialsSearch({ value, onChange }: Props) {
  const [text, setText] = useState(value) 
  const [debounced] = useDebouncedValue(text, DEBOUNCE_MS)

  const [previousValue, setPreviousValue] = useState(value)
  if (value !== previousValue) {
    setPreviousValue(value)
    if (value !== text.trim()) setText(value)
  }

  // Commit to the URL only once typing has paused (debounced has caught up with
  // text) and the result differs from what the URL already has.
  useEffect(() => {
    if (debounced === text && text.trim() !== value) onChange(text.trim())
  }, [debounced, text, value, onChange])

  return (
    <TextInput
      value={text}
      onChange={(event) => setText(event.currentTarget.value)}
      placeholder="Search by material no., description or MPN"
      aria-label="Search materials"
      maxLength={100}
      rightSection={
        text ? (
          <CloseButton
            aria-label="Clear search"
            onClick={() => {
              setText('')
              onChange('') // clear immediately, no need to wait for the debounce
            }}
          />
        ) : null
      }
    />
  )
}
