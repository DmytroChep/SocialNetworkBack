export const bigintSerializer = (_: string, value: unknown) =>
  typeof value === 'bigint'
    ? value.toString()
    : value;

export const parseIdToBigInt = (
  value?: string | number | bigint | string[] | null,
): bigint | null => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) value = value[0];

  if (typeof value === 'bigint') {
    return value > 0n ? value : null;
  }

  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) return null;
    return BigInt(value);
  }

  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '') return null;
    if (!/^\d+$/.test(t)) return null;
    try {
      const bi = BigInt(t);
      return bi > 0n ? bi : null;
    } catch {
      return null;
    }
  }

  return null;
};

export const ensureBigInt = (value: number | string | bigint) =>
  typeof value === 'bigint' ? value : BigInt(value);

export const sanitizeBigInts = (value: any): any => {
  if (typeof value === 'bigint') return value.toString();
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitizeBigInts);

  if (typeof value === 'object') {
    // Preserve buffers and other non-plain objects by attempting toJSON if available
    const proto = Object.getPrototypeOf(value);
    const isPlainObject = proto === Object.prototype || proto === null;

    if (!isPlainObject) {
      if (typeof (value as any).toJSON === 'function') {
        try {
          return sanitizeBigInts((value as any).toJSON());
        } catch {
          return value;
        }
      }
      return value;
    }

    const out: any = {};
    for (const key of Object.keys(value)) {
      out[key] = sanitizeBigInts((value as any)[key]);
    }
    return out;
  }

  return value;
};