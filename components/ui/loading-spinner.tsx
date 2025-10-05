import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl'
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text,
  showText = true 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      {/* Animated Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          "animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700",
          sizeClasses[size]
        )}>
          {/* Inner spinning element */}
          <div className={cn(
            "absolute top-0 left-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500",
            sizeClasses[size],
            "animate-spin"
          )} 
          style={{ animationDuration: '0.8s' }}
          />
        </div>
        
        {/* Pulsing center dot */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full animate-pulse",
          size === 'sm' ? 'w-1 h-1' : 
          size === 'md' ? 'w-1.5 h-1.5' :
          size === 'lg' ? 'w-2 h-2' : 'w-3 h-3'
        )} />
      </div>
      
      {/* Loading Text */}
      {showText && text && (
        <div className={cn(
          "font-medium text-gray-600 dark:text-gray-400 animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </div>
      )}
    </div>
  )
}

// Skeleton loader for table-like content
export function LoadingSkeleton({ 
  rows = 5, 
  className = '' 
}: { 
  rows?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Full page loading component
export function PageLoader({ 
  title, 
  subtitle 
}: { 
  title?: string
  subtitle?: string 
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center animate-in fade-in duration-300">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" showText={false} />
        {title && (
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 animate-in slide-in-from-bottom-2 duration-500 delay-150">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-gray-600 dark:text-gray-400 animate-in slide-in-from-bottom-2 duration-500 delay-300">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// Inline loading component for smaller spaces
export function InlineLoader({ 
  text = "Loading...", 
  size = "sm" 
}: { 
  text?: string
  size?: 'sm' | 'md' 
}) {
  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <LoadingSpinner size={size} showText={false} />
      <span className={cn(
        "animate-pulse",
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {text}
      </span>
    </div>
  )
}