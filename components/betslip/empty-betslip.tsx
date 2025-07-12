import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyBetslipProps {
  title: string
  onMakeCurrent?: () => void
  onSetDefault?: () => void
  onDelete?: () => void
}

export function EmptyBetslip({
  title,
  onMakeCurrent,
  onSetDefault,
  onDelete,
}: EmptyBetslipProps) {
  return (
    <div className="border border-dashed rounded-lg p-6 text-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">📈</div>
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">No selections yet</p>
        </div>
        
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
          <Link href="/browse" className="w-full">
            <Button variant="default" className="w-full">
              Browse Props
            </Button>
          </Link>
          
          <div className="flex gap-2">
            {onSetDefault && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onSetDefault}
              >
                Set Default
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 