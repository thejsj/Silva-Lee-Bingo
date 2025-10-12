import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Clue } from "@/lib/utils"

interface ClueDisplayProps {
  clue: Clue
  onPhotoUpload: (file: File, clueId: string) => Promise<void>
  isUploading: boolean
  uploadedPhotoUrl?: string
  isFinishedView?: boolean
  isSupabaseConfigured?: boolean
}

export default function ClueDisplay({
  clue,
  onPhotoUpload,
  isUploading,
  uploadedPhotoUrl,
  isFinishedView = false,
  isSupabaseConfigured = true,
}: ClueDisplayProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewUrl(uploadedPhotoUrl || null)
  }, [uploadedPhotoUrl])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isSupabaseConfigured) {
      alert("Supabase is not configured. Photo upload is disabled.")
      return
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      await onPhotoUpload(file, clue.id)
    } catch (error) {
      console.error("Upload failed:", error)
      setPreviewUrl(uploadedPhotoUrl || null)
    } finally {
      // Clean up the object URL
      URL.revokeObjectURL(objectUrl)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleUploadClick = () => {
    if (!isSupabaseConfigured) {
      alert("Supabase is not configured. Photo upload is disabled.")
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="p-6 text-center space-y-4">
      <div className="text-6xl mb-4">{clue.emoji}</div>

      <h2 className="text-xl font-bold text-bingo-green-dark mb-4">{clue.description}</h2>

      {previewUrl && (
        <div className="relative w-full max-w-sm mx-auto aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
          <img
            key={previewUrl}
            src={previewUrl || "/placeholder.svg"}
            alt="Uploaded photo"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {!isFinishedView && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || !isSupabaseConfigured}
          />

          <Button
            onClick={handleUploadClick}
            disabled={isUploading || !isSupabaseConfigured}
            className="bg-bingo-green-button hover:bg-bingo-green-button/90 text-white text-lg py-3 px-6 flex items-center justify-center mx-auto"
          >
            <span role="img" aria-label="camera" className="mr-3 text-xl">
              📷
            </span>
            {isUploading ? "Uploading..." : "Upload Photo"}
            <span role="img" aria-label="camera" className="ml-3 text-xl">
              📷
            </span>
          </Button>
        </>
      )}
    </div>
  )
}
