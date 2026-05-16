'use client'


import { useTranslations } from 'next-intl'
import { Divider } from '@/ui/divider'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SearchBtnPopover = () => {
  const router = useRouter()
  const t = useTranslations('header.searchPopover')

  return (
    <Popover>
      <PopoverButton className="-m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-0 dark:hover:bg-neutral-800">
        <HugeiconsIcon icon={Search01Icon} size={24} color="currentColor" strokeWidth={1.5} />
      </PopoverButton>

      <PopoverPanel
        transition
        className="header-popover-full-panel absolute inset-x-0 top-0 -z-10 bg-white pt-20 text-neutral-950 shadow-xl transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0 dark:border-b dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <div className="container">
          <div className="mx-auto flex w-full max-w-xl flex-col py-4">
            <form
              action={'#'}
              className="flex w-full items-center"
              onSubmit={(e) => {
                e.preventDefault()
                router.push('/start-categories/all' as unknown as Parameters<typeof router.push>[0])
              }}
            >
              <HugeiconsIcon icon={Search01Icon} size={26} color="currentColor" strokeWidth={1} />
              <input
                data-autofocus
                autoFocus
                type="text"
                className="w-full !border-none px-4 py-2 uppercase !ring-0 focus-visible:outline-none sm:text-sm/6"
                name="q"
                aria-label={t('searchAria')}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                aria-autocomplete="list"
              />
              <CloseButton
                aria-label={t('closeAria')}
                className="-m-2.5 inline-flex cursor-pointer items-center justify-center rounded-md p-2.5 transition-transform duration-300 hover:rotate-90"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={24} color="currentColor" strokeWidth={1} />
              </CloseButton>

              <input type="submit" value="" hidden />
            </form>
            <Divider className="my-4 block md:hidden" />
            <div className="block text-xs/6 text-neutral-500 uppercase md:hidden">
              {t('pressLabel')}{' '}
              <Link
                href={'/search'}
                className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-900"
              >
                <kbd className="text-xs font-medium">Enter</kbd>
              </Link>{' '}
              {t('toSearch')}{' '}
              <kbd className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-900">
                <span className="text-xs font-medium">Esc</span>
              </kbd>{' '}
              {t('toCancel')}
            </div>
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  )
}

export default SearchBtnPopover
