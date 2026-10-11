export function resolveSentryEnvironment(
  explicit?: string,
  appEnvironment?: string,
  deploymentEnvironment?: string,
): string {
  // NODE_ENV describes optimization mode, so a local production build is still local.
  return explicit?.trim() || appEnvironment?.trim() || deploymentEnvironment?.trim() || 'local';
}
