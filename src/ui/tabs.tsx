'use client'

/**
 * Tabs Component
 *
 * Componente de tabs sin estilos (headless/wireframe)
 * Basado en Headless UI Tab component
 */

import { cn } from '@/lib/utils'
import { Tab as HeadlessTab } from '@headlessui/react'
import * as React from 'react'

interface TabsProps extends React.ComponentPropsWithoutRef<typeof HeadlessTab.Group> {
  defaultValue?: string
  children: React.ReactNode
}

const Tabs = ({ defaultValue, children, ...props }: TabsProps) => {
  // Headless UI no usa defaultValue, usa defaultIndex
  // Vamos a usar una implementación controlada simple
  return <HeadlessTab.Group {...props}>{children}</HeadlessTab.Group>
}

const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <HeadlessTab.List
      ref={ref}
      className={cn(
        'text-muted-foreground inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-transparent p-0',
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof HeadlessTab>>(
  ({ className, children, ...props }, ref) => (
    <HeadlessTab
      ref={ref}
      className={({ selected }: { selected: boolean }) =>
        cn(
          'inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          // Default state
          'bg-primary-100 text-primary-700 hover:bg-primary-200',
          'dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-800/50',
          // Active state
          selected && 'bg-secondary-500 font-bold text-white dark:bg-secondary-500 dark:text-white',
          className
        )
      }
      {...props}
    >
      {children}
    </HeadlessTab>
  )
)
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof HeadlessTab.Panel>>(
  ({ className, ...props }, ref) => (
    <HeadlessTab.Panel
      ref={ref}
      className={cn(
        'ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  )
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsContent, TabsList, TabsTrigger }
