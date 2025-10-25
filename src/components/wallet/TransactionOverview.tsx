"use client";

import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";

type TxItem = {
  key: string;
  icon?: string;
  label: string;
  value: string;
  split?: boolean;
};

interface TransactionOverviewProps {
  txItems: TxItem[];
  title?: string;
}

export default function TransactionOverview({ txItems, title = "Transaction overview" }: TransactionOverviewProps) {
  return (
    <div>
      <Text size="sm" weight="semibold" tone="white">
        {title}
      </Text>
      <Card className="mb-4" appearance="container">
        <div className="mt-3 space-y-3 w-full">
          {txItems.map((item) => (
            <div key={item.key} className={`flex justify-between items-center ${item.split ? "" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                {item.icon ? <TokenIcon symbol={item.icon} width={22} height={22} /> : null}
                <div className="text-sm truncate">{item.label}</div>
              </div>
              <div className="flex-shrink-0 text-sm text-muted whitespace-nowrap text-right">{item.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
