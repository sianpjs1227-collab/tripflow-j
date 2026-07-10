/** OAuth 콜백·초대 등 로그인 게이트를 건너뛰는 경로 */
export function isAuthPublicPath(pathname: string): boolean {
  return (
    pathname === "/auth/callback" || pathname.startsWith("/invite/")
  );
}
