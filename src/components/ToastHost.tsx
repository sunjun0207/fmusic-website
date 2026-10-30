import { useToasts } from '../lib/toast'

export function ToastHost() {
  const items = useToasts()
  return (
    <div className="toast-host" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className="toast">
          {item.text}
        </div>
      ))}
    </div>
  )
}
