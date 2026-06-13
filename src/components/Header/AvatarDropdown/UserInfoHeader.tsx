import Avatar from '@/ui/Avatar'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface UserInfoHeaderProps {
  username: string
  displayName: string
  userAvatar?: string
  isVerified: boolean | null
  pioneerNumber: number | null
}

export default function UserInfoHeader({
  username,
  displayName,
  userAvatar,
  isVerified,
  pioneerNumber,
}: UserInfoHeaderProps) {
  const t = useTranslations('avatar')

  return (
    <Link href={`/${username}`} className="flex items-center space-x-3 transition-opacity hover:opacity-80">
      <div className="relative shrink-0">
        <Avatar className="size-12" src={userAvatar} initials={displayName?.slice(0, 2).toUpperCase()} />
        {isVerified && (
          <span
            aria-label={t('verifiedBadge')}
            title={t('verifiedBadge')}
            className="absolute -right-0.5 -bottom-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white dark:ring-neutral-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>

      <div className="grow">
        <h4 className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
          <span>{displayName}</span>
          {isVerified && (
            <span
              aria-label={t('verifiedBadge')}
              title={t('verifiedBadge')}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </h4>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">@{username}</p>
        {pioneerNumber != null && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 ring-1 ring-amber-300/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-2.5 w-2.5"
              aria-hidden="true"
            >
              <path d="M12 2.75 14.39 8 20 8.81l-4 3.92.94 5.49L12 15.77l-4.94 2.45L8 12.73l-4-3.92L9.61 8 12 2.75Z" />
            </svg>
            {t('pioneerNumber', { n: pioneerNumber })}
          </span>
        )}
      </div>
    </Link>
  )
}
