const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  if (!path || path.startsWith("#") || /^(?:[a-z]+:)?\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${configuredBasePath}${normalizedPath}`;
}
