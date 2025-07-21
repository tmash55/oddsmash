import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

interface UrlStateOptions {
  replace?: boolean // Use router.replace instead of router.push
  shallow?: boolean // Not used in app router, but kept for API compatibility
}

export function useUrlState<T extends Record<string, any>>(
  defaultValues: T,
  options: UrlStateOptions = {}
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Parse current URL params into state
  const currentState = useMemo(() => {
    const state = { ...defaultValues }
    
    Object.keys(defaultValues).forEach((key) => {
      const value = searchParams.get(key)
      if (value !== null) {
        // Type-aware parsing based on default value type
        const defaultValue = defaultValues[key as keyof T]
        
        if (typeof defaultValue === 'number') {
          const parsed = parseInt(value, 10)
          if (!isNaN(parsed)) {
            (state as any)[key] = parsed
          }
        } else if (typeof defaultValue === 'boolean') {
          (state as any)[key] = (value === 'true')
        } else {
          (state as any)[key] = value
        }
      }
    })
    
    return state
  }, [searchParams, defaultValues])

  // Update URL with new state
  const updateState = useCallback((updates: Partial<T>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === defaultValues[key]) {
        // Remove param if it's undefined, null, or equals default
        newParams.delete(key)
      } else {
        // Set param
        newParams.set(key, String(value))
      }
    })

    const newUrl = `${pathname}?${newParams.toString()}`
    
    if (options.replace) {
      router.replace(newUrl)
    } else {
      router.push(newUrl)
    }
  }, [router, pathname, searchParams, defaultValues, options.replace])

  // Update a single state value
  const setState = useCallback((key: keyof T, value: T[keyof T]) => {
    updateState({ [key]: value } as Partial<T>)
  }, [updateState])

  // Reset to defaults
  const resetState = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  return {
    state: currentState,
    updateState,
    setState,
    resetState,
  }
}

// Helper hook for debounced URL updates (useful for search)
export function useDebouncedUrlState<T extends Record<string, any>>(
  defaultValues: T,
  options: UrlStateOptions = {},
  debounceMs: number = 300
) {
  const { state, updateState: immediateUpdate, setState, resetState } = useUrlState(defaultValues, options)
  
  // For debounced updates, we'll use a timeout
  const updateState = useCallback((updates: Partial<T>) => {
    const timeoutId = setTimeout(() => {
      immediateUpdate(updates)
    }, debounceMs)
    
    return () => clearTimeout(timeoutId)
  }, [immediateUpdate, debounceMs])

  return {
    state,
    updateState,
    setState,
    resetState,
  }
} 