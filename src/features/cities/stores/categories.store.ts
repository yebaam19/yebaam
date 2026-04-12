import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CityCategory } from '../services/city-category.service'

interface CategoriesState {
  // Estado
  categories: CityCategory[]
  selectedCategory: CityCategory | null
  isLoading: boolean
  error: string | null

  // Acciones
  setCategories: (categories: CityCategory[]) => void
  setSelectedCategory: (category: CityCategory | null) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
}

/**
 * Store de Zustand para gestionar el estado de las categorías de ciudades
 * Opcional: Solo se usa si necesitas estado global más allá de React Query
 */
export const useCategoriesStore = create<CategoriesState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCategories: (categories) => set({ categories }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    { name: 'CategoriesStore' }
  )
)

/**
 * Selectores para optimizar re-renders
 */
export const selectCategories = (state: CategoriesState) => state.categories
export const selectSelectedCategory = (state: CategoriesState) => state.selectedCategory
export const selectIsLoading = (state: CategoriesState) => state.isLoading
export const selectError = (state: CategoriesState) => state.error
