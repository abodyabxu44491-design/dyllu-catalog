// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { randomBytes } from "node:crypto";
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const genCode = () => "DY-" + Array.from(randomBytes(6), (b) => ALPHA[b % ALPHA.length]).join("");
