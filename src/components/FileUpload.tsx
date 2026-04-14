import { useRef, useState, useCallback } from 'react'

interface Props {
  onFileLoad: (file: File) => void
  isGeocoding: boolean
  geocodeProgress: { done: number; total: number }
  fileName: string
}

export default function FileUpload({ onFileLoad, isGeocoding, geocodeProgress, fileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setPendingFile(file)
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleSubmit = () => {
    if (pendingFile) {
      onFileLoad(pendingFile)
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleChange}
        />
        <div className="text-3xl mb-2">📂</div>
        {pendingFile ? (
          <p className="text-sm font-medium text-gray-700 truncate">{pendingFile.name}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">Sleep bestand hierheen</p>
            <p className="text-xs text-gray-400 mt-1">.csv, .xlsx of .xls</p>
          </>
        )}
      </div>

      {fileName && !pendingFile && (
        <p className="text-xs text-gray-500 truncate">
          Geladen: <span className="font-medium">{fileName}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!pendingFile || isGeocoding}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGeocoding ? 'Bezig...' : 'Zet op kaart'}
      </button>

      {isGeocoding && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Geocoding...</span>
            <span>{geocodeProgress.done} / {geocodeProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
              style={{
                width: geocodeProgress.total > 0
                  ? `${(geocodeProgress.done / geocodeProgress.total) * 100}%`
                  : '0%'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
