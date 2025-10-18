import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'

interface Props {
  endsAt: string
}

function formatRemaining(end: number) {
  if (!Number.isFinite(end)) return '0m 0s'
  const diff = Math.max(0, end - Date.now())
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function AuctionTimer({ endsAt }: Props) {
  const [remaining, setRemaining] = useState<string>('0m 0s')

  useEffect(() => {
    const end = new Date(endsAt).getTime()
    setRemaining(formatRemaining(end))
    const id = setInterval(() => {
      setRemaining(formatRemaining(end))
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return <Text>{remaining}</Text>
}
