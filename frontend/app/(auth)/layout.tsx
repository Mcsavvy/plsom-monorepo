import React from "react";
import { PublicPageWrapper } from "@/components/wrappers";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicPageWrapper>{children}</PublicPageWrapper>;
}
