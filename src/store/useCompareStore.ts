import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductItem {
  id: string
  title: string
  price: number
  brand: string
  condition: string
  category: string
  images: string[]
  specs: Record<string, string>
}

interface CompareState {
  items: ProductItem[]
  addItem: (item: ProductItem) => void
  removeItem: (id: string) => void
  isSaved: (id: string) => boolean
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const exists = get().items.some((i) => i.id === item.id)
        if (!exists) {
          set({ items: [...get().items, item] })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      isSaved: (id) => {
        return get().items.some((i) => i.id === id)
      },
    }),
    {
      name: 'techmart-compare-storage',
    }
  )
)