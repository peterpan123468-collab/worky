import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'

interface Props {
  endsAt: string
}

export function AuctionTimer({ endsAt }: Props) {
  const [remaining, setRemaining] = useState<string>('')

  useEffect(() => {
    const end = new Date(endsAt).getTime()
    const id = setInterval(() => {
      const diff = Math.max(0, end - Date.now())
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return <Text>{remaining}</Text>
}

