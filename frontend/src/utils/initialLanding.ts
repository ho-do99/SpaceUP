export function shouldShowInitialLanding(pathname: string, accessToken: string | null) {
  return pathname === '/' && accessToken === null
}
