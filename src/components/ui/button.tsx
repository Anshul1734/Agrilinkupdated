import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * - default      brand green: the main action on a screen (Place order, Save, Sign in)
 * - add          solid red: Add to basket
 * - addOutline   red outline: the small Add button on product cards
 * - outline      grey outline: secondary actions
 * - ghost / quiet / link: low-emphasis actions
 */
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-field text-white hover:bg-field-deep",
        add: "bg-chili text-white hover:bg-chili/90",
        addOutline: "border border-chili bg-chili-wash/60 text-chili hover:bg-chili hover:text-white",
        ink: "bg-ink text-white hover:bg-ink/85",
        destructive: "bg-chili text-white hover:bg-chili/90",
        outline: "border border-input bg-paper-raised text-ink hover:border-ink/60 hover:bg-paper-sunk",
        secondary: "bg-paper-sunk text-ink hover:bg-accent",
        ghost: "text-ink hover:bg-paper-sunk",
        quiet: "h-auto px-0 py-0 font-medium text-ink hover:text-field hover:underline",
        link: "h-auto px-0 py-0 font-medium text-field hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    compoundVariants: [
      { variant: "quiet", size: ["default", "sm", "lg"], className: "h-auto px-0" },
      { variant: "link", size: ["default", "sm", "lg"], className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
