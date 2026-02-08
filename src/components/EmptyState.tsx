import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface EmptyStateProps {
  title: string
  description: string
  primaryAction?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  icon?: ReactNode
  className?: string
  step?: { current: number; total: number }
}

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  className = "",
  step,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[200px] text-center p-8 rounded-lg border border-dashed bg-muted/30 ${className}`}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      {step && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full mb-2">
          Step {step.current} of {step.total}
        </span>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} data-testid="empty-state-primary-action">
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="text-sm text-muted-foreground underline hover:no-underline hover:text-foreground"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}
