import { cn } from '@/lib/utils'

export function Avatar({
  src,
  name,
  initials,
  initialsColor,
  dimmed,
}: {
  src?: string
  name: string
  initials?: string
  initialsColor?: string
  dimmed?: boolean
}) {
  if (initials) {
    return (
      <div
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white',
          dimmed && 'opacity-50',
        )}
        style={{ backgroundColor: initialsColor }}
        aria-label={name}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn(
        'size-6 shrink-0 rounded-full object-cover',
        dimmed && 'opacity-50',
      )}
    />
  )
}
