// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
export function hasArabic(s: unknown): boolean;
export function arToEn(text: string | null | undefined, opts?: { timeout?: number }): Promise<string | null>;
export function arToEnMany(texts: (string | null | undefined)[], opts?: { timeout?: number }): Promise<(string | null)[]>;
export function titleCase(s: string): string;
