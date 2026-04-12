
import clsx from 'clsx'
import { FC } from 'react'

interface HeaderProps {
  hasBorderBottom?: boolean
  className?: string
}

const Header: FC<HeaderProps> = async ({ hasBorderBottom = true, className }) => {


  return (
    <div className={clsx('relative', className)}>
     
    </div>
  )
}

export default Header
