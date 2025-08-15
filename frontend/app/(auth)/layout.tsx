import React from "react";
import { PublicPageWrapper } from "@/components/wrappers";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicPageWrapper>{children}</PublicPageWrapper>;
}
