import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  variant?: "primary" | "muted"
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  variant = "primary" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  const variantClasses = {
    primary: "border-primary/70",
    muted: "border-muted-foreground/70"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <div 
          className={cn(
            "border-2 border-muted/20 rounded-full animate-spin",
            `border-t-${variant === 'primary' ? 'primary' : 'muted-foreground'}/70`,
            sizeClasses[size]
          )} 
        />
        <div 
          className={cn(
            "absolute inset-0 border border-muted/10 rounded-full",
            sizeClasses[size]
          )} 
        />
      </div>
    </div>
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center space-x-1", className)}>
      <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" />
    </div>
  )
}

export function LoadingSkeleton({ 
  className,
  children 
}: { 
  className?: string
  children?: React.ReactNode 
}) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-muted/50 rounded-md",
        className
      )}
    >
      {children}
    </div>
  )
} 