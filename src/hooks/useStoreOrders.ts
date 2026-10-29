import { useCallback, useEffect, useState } from 'react'
import type { Order } from '../types/admin'
import { fetchStoreOrders } from '../services/orderService'
import { isAdminLoggedIn } from '../services/authService'

export function useStoreOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isAdminLoggedIn()) {
      setOrders([])
      setLoading(false)
      setError('Faça login no admin para ver os pedidos do servidor.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const remote = await fetchStoreOrders()
      setOrders(remote)
      if (remote.length === 0) {
        setError(null)
      }
    } catch {
      setError('Não foi possível carregar pedidos do servidor.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { orders, loading, error, reload }
}
