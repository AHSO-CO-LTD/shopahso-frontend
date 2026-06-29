"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingShell from "@/components/loading/LoadingShell";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AuthRole } from "@/lib/auth/types";

type ProtectedBackofficeProps = {
  allowedRoles: AuthRole[];
  children: React.ReactNode;
  loadingLabel: string;
  loadingMessage: string;
};

// Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local only — never in .env or committed files
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default function ProtectedBackoffice({
  allowedRoles,
  children,
  loadingLabel,
  loadingMessage,
}: ProtectedBackofficeProps) {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();

  useEffect(() => {
    if (DEV_BYPASS) return;
    if (!isInitializing && (!profile || !allowedRoles.includes(profile.role))) {
      router.replace("/404");
    }
  }, [allowedRoles, isInitializing, profile, router]);

  // DEV BYPASS — remove before merging to production
  if (DEV_BYPASS) return <>{children}</>;

  if (isInitializing || !profile || !allowedRoles.includes(profile.role)) {
    return <LoadingShell label={loadingLabel} message={loadingMessage} variant="backoffice" />;
  }

  return <>{children}</>;
}
