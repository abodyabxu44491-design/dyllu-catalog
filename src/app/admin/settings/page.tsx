// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";
export const dynamic = "force-dynamic";
export default async function S() {
  return <SettingsForm initial={await getSettings()} />;
}
