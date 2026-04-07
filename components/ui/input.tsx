import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "h-11 w-full min-w-0 appearance-none rounded-xl border border-[rgba(169,190,255,0.14)] bg-[linear-gradient(180deg,rgba(14,19,41,0.88)_0%,rgba(9,13,30,0.8)_100%)] px-3.5 py-2 text-sm text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow,background-color,color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text)] placeholder:text-[rgba(240,240,255,0.26)] hover:border-[rgba(177,197,255,0.2)] focus-visible:border-[rgba(126,151,255,0.52)] focus-visible:ring-4 focus-visible:ring-[rgba(91,127,255,0.12)] focus-visible:shadow-[0_0_24px_rgba(91,127,255,0.14)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[rgba(255,255,255,0.03)] aria-invalid:border-[rgba(255,91,127,0.5)] aria-invalid:ring-4 aria-invalid:ring-[rgba(255,91,127,0.14)]",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
