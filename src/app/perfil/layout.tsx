import { BuyerProfileShell } from "@/components/market/BuyerProfileShell";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BuyerProfileShell>{children}</BuyerProfileShell>;
}
