"use client";

import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import Text from "@/components/ui/text";
import React from "react";
import TokenIcon from "../common/TokenIcon";
import { Button } from "../ui/button";

interface AssetItem {
  id?: string;
  symbol: string;
  amount?: number;
  icon?: React.ReactNode;
  usdValue: number | string;
  actionLabel?: string;
  onAction?: (id?: string) => void;
}

interface AssetsProps {
  items: AssetItem[];
}

export default function Assets({ items }: AssetsProps) {
  return (
    <div className={`w-full`}>
      <div className="grid grid-cols-3 items-center mb-3">
        <div className="text-center">
          <Text size="sm" weight="semibold" case="upper" tone="white">
            ASSETS
          </Text>
        </div>
        <div className="text-left pl-6">
          <Text size="sm" weight="semibold" case="upper" tone="white">
            USD VALUE
          </Text>
        </div>
        <div className="w-28" />
      </div>

      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <Card key={it.id ?? it.symbol} asChild padding="none" shadow="sm">
            <div className="w-full grid grid-cols-3 items-center px-4 py-3">
              <div className="flex items-center gap-3">
                <TokenIcon symbol={it.symbol} width={32} height={32} />
                <div>
                  <Text size="sm" weight="semibold" tone="white">
                    {it.symbol}
                  </Text>
                  <div className="text-xs text-muted/70">
                    <MaskedValue value={it.amount?.toFixed(4) ?? "-"} mask="short" />
                  </div>
                </div>
              </div>

              <div className="text-left pl-6">
                <MaskedValue value={it.usdValue} mask="long" className="text-sm font-semibold text-white" />
              </div>

              <div className="text-right">
                <Button variant="secondary" onClick={() => it.onAction?.(it.id)} className="ml-3">
                  {it.actionLabel ?? "Deposit"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
