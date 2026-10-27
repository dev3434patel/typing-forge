export const DEPLOYMENT_TARGETS: readonly string[];
export interface DeploymentConfig {
  target: "php" | "vercel" | "github-pages";
  base: string;
  frontendOnly: boolean;
  apiBase: string;
  siteUrl: string;
}
export function normalizeBasePath(value?: string): string;
export function resolveDeploymentConfig(
  environment?: Record<string, string | undefined>,
): DeploymentConfig;
export function resolvePagesLocation(
  repository?: string,
  siteUrl?: string,
): { base: string; siteUrl: string };
