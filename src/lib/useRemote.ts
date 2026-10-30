import { useEffect, useRef, useState } from 'react'
import { MissingError, NETWORK_TIP } from './kuwo'

const settled = new Map<string, unknown>()

type State<T> = { key: string; data?: T; error: string; missing: boolean; loading: boolean }

function initial<T>(key: string, enabled: boolean): State<T> {
  const data = settled.get(key) as T | undefined
  return { key, data, error: '', missing: false, loading: enabled && data === undefined }
}

/** 按 key 取远端数据；回到看过的页面先显示上次结果，不闪加载态。 */
export function useRemote<T>(key: string, load: () => Promise<T>, enabled = true) {
  const loadRef = useRef(load)
  loadRef.current = load
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<State<T>>(() => initial<T>(key, enabled))

  useEffect(() => {
    if (!enabled) return
    let cancel = false
    setState(initial<T>(key, true))
    loadRef.current().then(
      (data) => {
        settled.set(key, data)
        if (!cancel) setState({ key, data, error: '', missing: false, loading: false })
      },
      (reason: unknown) => {
        if (cancel) return
        setState({
          key,
          data: settled.get(key) as T | undefined,
          error: reason instanceof Error && reason.message ? reason.message : NETWORK_TIP,
          missing: reason instanceof MissingError,
          loading: false,
        })
      },
    )
    return () => {
      cancel = true
    }
  }, [key, tick, enabled])

  const current = state.key === key ? state : initial<T>(key, enabled)
  return { ...current, reload: () => setTick((value) => value + 1) }
}
