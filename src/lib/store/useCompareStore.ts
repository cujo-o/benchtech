import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductItem {
  id: string
  title: string
  brand: string
  model: string
  price: number
  condition: string
  category: string
  images: string[]
  specs: Record<string, string>
}

interface CompareState {
  items: ProductItem[]
  addItem: (product: ProductItem) => void
  removeItem: (id: string) => void
  clearCompare: () => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const current = get().items
        if (current.some((i) => i.id === product.id)) return
        if (current.length >= 4) {
          alert('You can compare a maximum of 4 devices at a time.')
          return
        }
        set({ items: [...current, product] })
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      clearCompare: () => set({ items: [] }),
    }),
    {
      name: 'techmart-compare-storage',
    }
  )
)