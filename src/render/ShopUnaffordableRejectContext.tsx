import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
/** Keep in sync with `--duration-shop-unaffordable-reject` in tokens.css. */
const SHOP_UNAFFORDABLE_REJECT_MS = 450

type ShopUnaffordableRejectContextValue = Readonly<{
  rejectFlashSlot: number | null
  goldRejectFlash: boolean
  flashUnaffordable: (slotIndex: number) => void
}>

const ShopUnaffordableRejectContext = createContext<ShopUnaffordableRejectContextValue | null>(null)

export function ShopUnaffordableRejectProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const [rejectFlashSlot, setRejectFlashSlot] = useState<number | null>(null)
  const [goldRejectFlash, setGoldRejectFlash] = useState(false)
  const rejectFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (rejectFlashTimer.current != null) clearTimeout(rejectFlashTimer.current)
    },
    [],
  )

  const flashUnaffordable = useCallback((slotIndex: number) => {
    setRejectFlashSlot(slotIndex)
    setGoldRejectFlash(true)
    if (rejectFlashTimer.current != null) clearTimeout(rejectFlashTimer.current)
    rejectFlashTimer.current = setTimeout(() => {
      setRejectFlashSlot(null)
      setGoldRejectFlash(false)
      rejectFlashTimer.current = null
    }, SHOP_UNAFFORDABLE_REJECT_MS)
  }, [])

  return (
    <ShopUnaffordableRejectContext.Provider
      value={{ rejectFlashSlot, goldRejectFlash, flashUnaffordable }}
    >
      {children}
    </ShopUnaffordableRejectContext.Provider>
  )
}

export function useShopUnaffordableReject(): ShopUnaffordableRejectContextValue {
  const ctx = useContext(ShopUnaffordableRejectContext)
  if (!ctx) throw new Error('useShopUnaffordableReject must be used within ShopUnaffordableRejectProvider')
  return ctx
}

/** HUD gold flash — optional when outside shop reject provider is impossible; always inside GameView. */
export function useShopUnaffordableRejectGoldFlash(): boolean {
  return useContext(ShopUnaffordableRejectContext)?.goldRejectFlash ?? false
}
