import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap outline-none transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-muted data-[pressed]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-8 px-2.5",
        sm: "h-7 px-2",
        lg: "h-9 px-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Toggle({
  className,
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
