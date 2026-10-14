// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import TradeApp from "@/components/trade/TradeApp";
import TradeLogin from "@/components/trade/TradeLogin";
import { currentTrade } from "@/lib/tradeAuth";
export const dynamic = "force-dynamic";
export default async function TradePage() {
  const shop = await currentTrade();
  return shop ? <TradeApp shop={shop.name} /> : <TradeLogin />;
}
