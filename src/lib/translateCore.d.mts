export function hasArabic(s: unknown): boolean;
export function arToEn(text: string | null | undefined, opts?: { timeout?: number }): Promise<string | null>;
export function arToEnMany(texts: (string | null | undefined)[], opts?: { timeout?: number }): Promise<(string | null)[]>;
export function titleCase(s: string): string;
