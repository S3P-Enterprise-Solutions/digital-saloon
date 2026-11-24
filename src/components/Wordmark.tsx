import type * as React from 'react'

import { getActiveBrandModule } from '../brands/active'

export type HeaderWordmarkProps = {
  label: string
  onClick: () => void
}

/** Delegates to the active brand module's shell wordmarks. */
export const HeroWordmark: React.FunctionComponent = (props) => {
  const Hero = getActiveBrandModule().shell?.HeroWordmark
  if (!Hero) return null
  return <Hero {...props} />
}

export const HeaderWordmark: React.FunctionComponent<HeaderWordmarkProps> = (props) => {
  const Header = getActiveBrandModule().shell?.HeaderWordmark
  if (!Header) return null
  return <Header {...props} />
}
