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

  const processFile = useCallback(
    (file: File) => {
      setUploadedFile(file)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Call parent handler
      onImageUpload(file)
    },
    [onImageUpload],
  )

  // Handle clipboard paste
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (isProcessing) return

      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.type.startsWith("image/")) {
          e.preventDefault()

          const file = item.getAsFile()
          if (file) {
            // Create a proper filename for the pasted image
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            const extension = file.type.split("/")[1] || "png"
            const renamedFile = new File([file], `pasted-betslip-${timestamp}.${extension}`, {
              type: file.type,
            })

            processFile(renamedFile)
            toast.success("Image pasted successfully!")
            setShowPasteHint(false)
          }
          break
        }
      }
    },
    [isProcessing, processFile],
  )

  // Add global paste event listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste)
    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [handlePaste])

  // Show paste hint when user focuses the upload area
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && !uploadedFile && !isProcessing) {
        setShowPasteHint(true)
        setTimeout(() => setShowPasteHint(false), 3000)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [uploadedFile, isProcessing])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: isProcessing,
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
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type)
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            const extension = type.split("/")[1] || "png"
            const file = new File([blob], `pasted-betslip-${timestamp}.${extension}`, {
              type: type,
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
      <Card
        className={cn(
          "p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800",
          className,
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900 dark:text-white">Uploaded Betslip</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearUpload}
              disabled={isProcessing}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative max-w-md mx-auto">
            <Image
              src={previewUrl || "/placeholder.svg"}
              alt="Uploaded betslip"
              width={400}
              height={600}
              className="rounded-lg border border-slate-200 dark:border-slate-700 object-contain max-h-96 w-full"
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

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <FileImage className="h-4 w-4 inline mr-1" />
            {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800",
        className,
      )}
    >
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 relative",
          isDragActive
            ? "border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-500/10 scale-[1.02]"
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500",
          isProcessing && "opacity-50 cursor-not-allowed",
          showPasteHint && "border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-500/20 scale-[1.02]",
        )}
      >
        <input {...getInputProps()} />

        {/* Paste Hint Overlay */}
        {showPasteHint && (
          <div className="absolute inset-0 bg-green-50/90 dark:bg-green-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border-2 border-green-400 dark:border-green-500">
            <div className="text-center">
              <Clipboard className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-green-700 dark:text-green-300 font-medium">Paste your screenshot now!</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            ) : (
              <Camera className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            )}
          </div>

          <div className="space-y-3">{/* Placeholder for additional content */}</div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isDragActive ? "Drop your betslip here" : "Upload Betslip Screenshot"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {isDragActive
                ? "Release to upload your betslip image"
                : "Drag & drop, paste from clipboard, or click to browse"}
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              disabled={isProcessing}
              className="h-12 px-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 active:scale-[0.98]"
            >
              <Camera className="h-4 w-4 mr-2" />
              Choose File
            </Button>

            <Button
              variant="outline"
              onClick={handlePasteClick}
              disabled={isProcessing}
              className="h-12 px-6 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:border-blue-500/50 dark:text-blue-300 hover:border-blue-300 dark:hover:border-blue-400 transition-all duration-200 active:scale-[0.98]"
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Paste Image
            </Button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div>Supports PNG, JPG, JPEG, GIF, WebP (Max 10MB)</div>
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
              <span>💡 Tip: Take a screenshot and press</span>
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                Ctrl+V
              </kbd>
              <span>to paste</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
