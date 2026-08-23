import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import { Button } from "../../../components/controls/Button";
import { EntityToolbar } from "../../../components/layout/EntityPageLayout";

interface ReportsToolbarProps {
  children: ReactNode;
  clearSlot?: ReactNode;
  onPrint: () => void;
}

export function ReportsToolbar({
  children,
  clearSlot,
  onPrint,
}: ReportsToolbarProps) {
  return (
    <EntityToolbar>
      {children}
      {clearSlot}
      <Button variant="secondary" onPress={onPrint}>
        <Printer size={16} strokeWidth={2} />
        طباعة
      </Button>
    </EntityToolbar>
  );
}
