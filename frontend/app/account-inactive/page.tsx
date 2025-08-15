import { Metadata } from "next";
import { AccountInactivePage } from "@/components/auth/account-inactive-page";
import ProtectedPageWrapper from "@/components/wrappers/protected-page-wrapper";

export const metadata: Metadata = {
  title: "Account Inactive - PLSOM LMS",
  description: "Your account has been deactivated and requires admin activation."
};

export default function AccountInactive() {
  return (
    <ProtectedPageWrapper showLoading={false} redirectTo="/login">
      <AccountInactivePage />
    </ProtectedPageWrapper>
  );
}
