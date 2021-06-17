/**
 * Parses the cache option string to Record<string, string>
 */
export function parseCacheOption(opts: string): Record<string, string> {
  return Object.fromEntries(
    opts.split(/\s*,\s*/).map((opt) => {
      const [k, v] = opt.split(":");
      if (!k || !v) {
        throw new Error(`Invalid --cache option: ${opts}`);
      }
      return [k, v];
    }),
  );
}
