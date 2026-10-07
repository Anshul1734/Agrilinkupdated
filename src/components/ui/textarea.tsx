import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-md border border-input bg-paper-raised px-3 py-2 text-sm text-ink transition-[border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-ink-soft/70 hover:border-ink/50 focus-visible:border-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field/20 aria-[invalid=true]:border-chili aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-chili/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
