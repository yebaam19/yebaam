'use client'

import * as Headless from '@headlessui/react'
import NextLink from 'next/link'
import React, { forwardRef } from 'react'

// Loose Link wrapper that accepts any string href. We intentionally don't use
// Next.js 16's typed-routes LinkProps<...> here because this component is
// shared across UI bits (Badge, Button, Pagination, navbar, SocialsList, Tag…)
// where the href is dynamic and not a known static route.
type LooseLinkProps = Omit<React.ComponentPropsWithoutRef<typeof NextLink>, 'href'> & {
  href: string
}

export const Link = forwardRef(function Link(
  props: LooseLinkProps & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const closeHeadless = Headless.useClose()

  return (
    <Headless.DataInteractive>
      <NextLink
        {...(props as React.ComponentProps<typeof NextLink>)}
        ref={ref}
        onClick={(e) => {
          if (props.onClick) {
            props.onClick(e)
          }
          // Prevent default if the link is not a valid URL
          if (e.defaultPrevented) {
            return
          }
          // Prevent default if the link is a hash link
          if (props.href && typeof props.href === 'string' && props.href.startsWith('#')) {
            return
          }

          // Close the headlessui menu and aside
          closeHeadless()
        }}
      />
    </Headless.DataInteractive>
  )
})
