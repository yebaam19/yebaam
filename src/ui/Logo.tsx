import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import YebaamLogo from '@/images/brand/Yebaam-Logo.png'
import YebaamLogoLight from '@/images/brand/Logo-Yebaam_white.png'

interface LogoProps {
  className?: string
}

// YEBAAM wordmark (2026 brand manual). Green on light surfaces, cream in dark mode.
const Logo: React.FC<LogoProps> = ({ className = 'w-22 sm:w-24' }) => {
  return (
    <Link href="/" className={`inline-block focus:ring-0 focus:outline-hidden ${className}`}>
      <Image src={YebaamLogo} alt="Yebaam" className="h-auto w-full dark:hidden" priority unoptimized />
      <Image src={YebaamLogoLight} alt="Yebaam" className="hidden h-auto w-full dark:block" priority unoptimized />
    </Link>
  )
}

export default Logo
