'use client'

import { useEffect, useRef } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    cancelRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close dialog" />
      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#0a0a0f] p-5 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[#94a3b8]">{description}</p> : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button ref={cancelRef} onClick={onClose} className="btn-secondary px-4 py-2">
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              destructive
                ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/30 border border-indigo-500/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

