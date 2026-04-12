'use client'

import { EllipsisHorizontalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'

interface CommentActionsProps {
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

export function CommentActions({ onEdit, onDelete, isDeleting = false }: CommentActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isOpen])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón toggle */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        aria-label="Opciones del comentario"
      >
        <EllipsisHorizontalIcon className="h-4 w-4" />
      </button>

      {/* Dropdown menu - usando position fixed para evitar overflow issues */}
      {isOpen && (
        <div
          className="fixed z-50 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <button
            onClick={() => {
              onEdit()
              setIsOpen(false)
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Editar</span>
          </button>

          <button
            onClick={() => {
              onDelete()
              setIsOpen(false)
            }}
            disabled={isDeleting}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <TrashIcon className="h-4 w-4" />
            <span>{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
