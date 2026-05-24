import { Loader2Icon } from "lucide-react"

import { cn } from "@fund/lib/utils"

function Spinner({
  className,
  ...props
}) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 animate-spin text-muted-foreground motion-reduce:animate-none",
        className
      )}
      {...props} />
  );
}

export { Spinner }
