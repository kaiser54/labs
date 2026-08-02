import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

const iconNames = [
  'search',
  'filter',
  'close',
  'chevron-down',
  'chevron-left',
  'check',
  'linear',
] as const

export type IconName = (typeof iconNames)[number]

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
}

/** Renders a symbol from the SVGO-optimized SVG sprite. */
export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      className={cn('size-4 shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      <use href={`#icon-${name}`} />
    </svg>
  )
}
