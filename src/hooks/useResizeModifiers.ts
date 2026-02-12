import { useState, useEffect } from 'react'

/**
 * Hook pro modifikátory při změně velikosti:
 * - Shift: zachovat poměr stran
 */
export function useResizeModifiers() {
  const [shiftPressed, setShiftPressed] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return {
    keepAspectRatio: shiftPressed,
  }
}
