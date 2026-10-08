// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { currentRep } from "@/lib/repAuth";
import { prettyPhone } from "@/lib/phone";
import { Card, PageHead } from "@/components/admin/ui";
import { RepLogout, RepPassword } from "@/components/rep/RepPassword";
import InstallApp from "@/components/InstallApp";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
export default async function RepAccount() {
  const rep = (await currentRep())!;
  return (
    <div className="space-y-4 max-w-2xl">
      <PageHead title="حسابي" />
      <Card>
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-ink text-lime grid place-items-center text-2xl font-extrabold overflow-hidden shrink-0">
            {rep.photo ? <img src={rep.photo} alt="" className="w-full h-full object-cover" /> : rep.name[0]}
          </span>
          <div className="min-w-0">
            <b className="block text-lg">{rep.name}</b>
            <small className="block text-steel">
              <Icon n="pin" s={13} className="inline" /> {rep.location}
            </small>
            <small className="block text-steel" dir="ltr" style={{ textAlign: "start" }}>
              {prettyPhone(rep.phone)}
            </small>
          </div>
        </div>
        <p className="text-xs text-steel mt-4 leading-5">لتعديل الاسم أو الرقم أو الصورة تواصل مع الإدارة. رقم جوالك هو اسم الدخول.</p>
      </Card>
      <Card title="كلمة المرور" desc="تغييرها يُخرج حسابك من الأجهزة الأخرى">
        <RepPassword />
      </Card>
      <Card title="التطبيق" desc="ثبّت DYLLU على جوالك لتفتح حسابك بضغطة">
        <div className="flex flex-wrap gap-2">
          <InstallApp variant="admin" />
          <RepLogout />
        </div>
      </Card>
    </div>
  );
}
