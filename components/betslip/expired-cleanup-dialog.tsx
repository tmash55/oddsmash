"use client"

import { useState } from "react"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ExpiredSelectionInfo, 
  formatSelectionForDisplay,
  generateExpiredMessage 
} from "@/lib/betslip-cleanup-utils"

interface ExpiredCleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expiredSelections: ExpiredSelectionInfo[]
  onRemoveExpired: (selectionIds: string[]) => Promise<void>
  onRemoveAll: () => Promise<void>
  isLoading?: boolean
}

export function ExpiredCleanupDialog({
  open,
  onOpenChange,
  expiredSelections,
  onRemoveExpired,
  onRemoveAll,
  isLoading = false
}: ExpiredCleanupDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [action, setAction] = useState<'review' | 'confirm_all' | 'confirm_selected'>('review')

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(expiredSelections.map(info => info.selection.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return
    
    await onRemoveExpired(Array.from(selectedIds))
    setSelectedIds(new Set())
    setAction('review')
    onOpenChange(false)
  }

  const handleRemoveAll = async () => {
    await onRemoveAll()
    setAction('review')
    onOpenChange(false)
  }

  const handleClose = () => {
    setAction('review')
    setSelectedIds(new Set())
    onOpenChange(false)
  }

  if (expiredSelections.length === 0) return null

  const gameStartedCount = expiredSelections.filter(info => info.reason === 'game_started').length
  const gameFinishedCount = expiredSelections.filter(info => info.reason === 'game_finished').length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Expired Selections Found
          </DialogTitle>
          <DialogDescription>
            {generateExpiredMessage(expiredSelections)}
          </DialogDescription>
        </DialogHeader>

        {action === 'review' && (
          <>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Games have started or finished for some of your selections. 
                Since live betting isn't available, these should be removed.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    {gameStartedCount} Started
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {gameFinishedCount} Finished
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedIds.size === expiredSelections.length}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedIds.size === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="space-y-3">
                  {expiredSelections.map((info) => (
                    <div
                      key={info.selection.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedIds.has(info.selection.id) 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                      onClick={() => handleToggleSelection(info.selection.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(info.selection.id)}
                        onChange={() => handleToggleSelection(info.selection.id)}
                        className="rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {formatSelectionForDisplay(info.selection)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Game started {info.minutesExpired}min ago
                        </div>
                      </div>
                      
                      <Badge
                        variant="outline"
                        className={
                          info.reason === 'game_started' 
                            ? 'text-amber-600 border-amber-200' 
                            : 'text-red-600 border-red-200'
                        }
                      >
                        {info.reason === 'game_started' ? 'Started' : 'Finished'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Keep All
              </Button>
              <Button
                variant="outline"
                onClick={() => setAction('confirm_selected')}
                disabled={selectedIds.size === 0}
              >
                Remove Selected ({selectedIds.size})
              </Button>
              <Button
                onClick={() => setAction('confirm_all')}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove All Expired
              </Button>
            </DialogFooter>
          </>
        )}

        {action === 'confirm_selected' && (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Remove {selectedIds.size} selected expired selection{selectedIds.size > 1 ? 's' : ''}?
                This action cannot be undone.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAction('review')}>
                Back
              </Button>
              <Button
                onClick={handleRemoveSelected}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Removing...' : `Remove ${selectedIds.size} Selection${selectedIds.size > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </>
        )}

        {action === 'confirm_all' && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Remove all {expiredSelections.length} expired selections?
                This action cannot be undone.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAction('review')}>
                Back
              </Button>
              <Button
                onClick={handleRemoveAll}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Removing...' : 'Remove All Expired'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 