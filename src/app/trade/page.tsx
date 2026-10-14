// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import TradeApp from "@/components/trade/TradeApp";
import TradeLocked from "@/components/trade/TradeLocked";
import { verifyTradeKey } from "@/lib/session";
import { currentTrade } from "@/lib/tradeAuth";
export const dynamic = "force-dynamic";
export default async function TradePage({ searchParams }: { searchParams: { k?: string } }) {
  const k = typeof searchParams.k === "string" ? searchParams.k : null,
    shop = await currentTrade(k),
    fromLink = shop && k ? await verifyTradeKey(k) : null;
  return shop ? <TradeApp shop={shop.name} linkKey={fromLink?.id === shop.id ? k : null} /> : <TradeLocked />;
}
