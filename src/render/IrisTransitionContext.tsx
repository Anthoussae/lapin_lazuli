import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { IrisOverlay, type IrisCenter, type ScreenIrisColor } from './primitives/IrisOverlay'

type IrisPhase = 'idle' | 'out' | 'in'

export type IrisTransitionOptions = Readonly<{
  screenColor?: ScreenIrisColor
}>

type IrisTransitionContextValue = Readonly<{
  isActive: boolean
  runIrisTransition: (onMidpoint: () => void, options?: IrisTransitionOptions) => void
}>

const IrisTransitionContext = createContext<IrisTransitionContextValue | null>(null)

const SCREEN_CENTER: IrisCenter = { xPercent: 50, yPercent: 50 }

export function IrisTransitionProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const [phase, setPhase] = useState<IrisPhase>('idle')
  const onMidpointRef = useRef<(() => void) | null>(null)
  const screenColorRef = useRef<ScreenIrisColor>('default')

  const runIrisTransition = useCallback((onMidpoint: () => void, options?: IrisTransitionOptions) => {
    setPhase((current) => {
      if (current !== 'idle') return current
      onMidpointRef.current = onMidpoint
      screenColorRef.current = options?.screenColor ?? 'default'
      return 'out'
    })
  }, [])

  const handleOutComplete = useCallback(() => {
    onMidpointRef.current?.()
    onMidpointRef.current = null
    setPhase('in')
  }, [])

  const handleInComplete = useCallback(() => {
    screenColorRef.current = 'default'
    setPhase('idle')
  }, [])

  return (
    <IrisTransitionContext.Provider value={{ isActive: phase !== 'idle', runIrisTransition }}>
      {children}
      {phase !== 'idle' ? (
        <IrisOverlay
          key={phase}
          mode={phase}
          center={SCREEN_CENTER}
          screenColor={screenColorRef.current}
          onComplete={phase === 'out' ? handleOutComplete : handleInComplete}
        />
      ) : null}
    </IrisTransitionContext.Provider>
  )
}

export function useIrisTransition(): IrisTransitionContextValue {
  const ctx = useContext(IrisTransitionContext)
  if (!ctx) throw new Error('useIrisTransition must be used within IrisTransitionProvider')
  return ctx
}
