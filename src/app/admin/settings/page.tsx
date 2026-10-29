// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getSettings } from "@/lib/settings";
import { uploadsStatus } from "@/lib/admin/moveUploads";
import SettingsForm from "@/components/admin/SettingsForm";
import StorageCard from "@/components/admin/StorageCard";
export const dynamic = "force-dynamic";
export default async function S() {
  const [s, st] = await Promise.all([getSettings(), uploadsStatus()]);
  return (
    <div className="space-y-4 md:space-y-5">
      <SettingsForm initial={s} />
      <div className="max-w-4xl">
        <StorageCard {...st} />
      </div>
    </div>
  );
}
