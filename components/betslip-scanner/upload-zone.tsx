"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Upload, X, FileImage, Clipboard } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

interface UploadZoneProps {
  onImageUpload: (file: File) => void
  isProcessing?: boolean
  className?: string
}

export function UploadZone({ onImageUpload, isProcessing = false, className }: UploadZoneProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPasteHint, setShowPasteHint] = useState(false)

  const processFile = useCallback((file: File) => {
    setUploadedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Call parent handler
    onImageUpload(file)
  }, [onImageUpload])

  // Handle clipboard paste
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (isProcessing) return
    
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        
        const file = item.getAsFile()
        if (file) {
          // Create a proper filename for the pasted image
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const extension = file.type.split('/')[1] || 'png'
          const renamedFile = new File([file], `pasted-betslip-${timestamp}.${extension}`, {
            type: file.type
          })
          
          processFile(renamedFile)
          toast.success("Image pasted successfully!")
          setShowPasteHint(false)
        }
        break
      }
    }
  }, [isProcessing, processFile])

  // Add global paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  // Show paste hint when user focuses the upload area
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !uploadedFile && !isProcessing) {
        setShowPasteHint(true)
        setTimeout(() => setShowPasteHint(false), 3000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [uploadedFile, isProcessing])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  const clearUpload = () => {
    setUploadedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handlePasteClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const extension = type.split('/')[1] || 'png'
            const file = new File([blob], `pasted-betslip-${timestamp}.${extension}`, {
              type: type
            })
            
            processFile(file)
            toast.success("Image pasted successfully!")
            return
          }
        }
      }
      
      toast.error("No image found in clipboard")
    } catch (error) {
      toast.error("Unable to access clipboard. Try using Ctrl+V instead.")
    }
  }

  if (uploadedFile && previewUrl) {
    return (
      <Card className={cn("p-4 bg-muted/30 dark:glassmorphic", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium dark:text-white">Uploaded Betslip</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearUpload}
              disabled={isProcessing}
              className="dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative max-w-md mx-auto">
            <Image
              src={previewUrl}
              alt="Uploaded betslip"
              width={400}
              height={600}
              className="rounded-lg border dark:border-white/20 object-contain max-h-96 w-full"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="text-white text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Analyzing betslip...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-muted-foreground dark:text-white/70">
            <FileImage className="h-4 w-4 inline mr-1" />
            {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-8 bg-muted/30 dark:glassmorphic", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors relative",
          isDragActive ? "border-primary bg-primary/5 dark:border-blue-400 dark:bg-blue-500/10" : "border-muted-foreground/25 dark:border-white/30",
          isProcessing && "opacity-50 cursor-not-allowed",
          showPasteHint && "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-500/20"
        )}
      >
        <input {...getInputProps()} />
        
        {/* Paste Hint Overlay */}
        {showPasteHint && (
          <div className="absolute inset-0 bg-green-50/90 dark:bg-green-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm dark:border dark:border-green-400">
            <div className="text-center">
              <Clipboard className="h-8 w-8 text-green-600 dark:text-green-300 mx-auto mb-2" />
              <p className="text-green-700 dark:text-green-200 font-medium">
                Paste your screenshot now!
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center dark:bg-white/10 dark:backdrop-blur-sm dark:border dark:border-white/20">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-primary dark:text-blue-400" />
            ) : (
              <Camera className="h-8 w-8 text-muted-foreground dark:text-white/80" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold dark:text-white">
              {isDragActive ? "Drop your betslip here" : "Upload Betslip Screenshot"}
            </h3>
            <p className="text-muted-foreground dark:text-white/70">
              {isDragActive 
                ? "Release to upload your betslip image"
                : "Drag & drop, paste from clipboard, or click to browse"
              }
            </p>
          </div>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Button 
              variant="outline" 
              disabled={isProcessing}
              className="dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/30 dark:text-white dark:backdrop-blur-sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handlePasteClick}
              disabled={isProcessing}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:border-blue-400/50 dark:text-blue-200 dark:backdrop-blur-sm"
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Paste Image
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground dark:text-white/60 space-y-1">
            <div>Supports PNG, JPG, JPEG, GIF, WebP (Max 10MB)</div>
            <div className="text-blue-600 dark:text-blue-300">
              💡 Tip: Take a screenshot and press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/20 dark:backdrop-blur-sm rounded text-xs dark:border dark:border-white/30">Ctrl+V</kbd> to paste
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
} 