'use client'

import { cn } from '@/lib/utils'
import { Modal } from './modal'

type AlertConfirmProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  destructive?: boolean
}

export function AlertConfirm({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
}: AlertConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} className="max-w-sm mx-4">
      <div className="p-6">
        <h2 className="font-syne font-bold text-[16px] text-text-1 mb-2">{title}</h2>
        <p className="text-[13px] text-text-2 leading-relaxed mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-9 px-4 text-[13px] font-medium text-text-2 border border-border-default rounded-lg hover:border-border-hi hover:text-text-1 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-9 px-4 text-[13px] font-bold rounded-lg transition-all disabled:opacity-50',
              destructive
                ? 'bg-red-lp text-white hover:brightness-110'
                : 'bg-accent text-bg-base hover:brightness-110'
            )}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
