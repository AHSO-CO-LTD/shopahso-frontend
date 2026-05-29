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

export default function ProtectedBackoffice({
  allowedRoles,
  children,
  loadingLabel,
  loadingMessage,
}: ProtectedBackofficeProps) {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();

  useEffect(() => {
    if (!isInitializing && (!profile || !allowedRoles.includes(profile.role))) {
      router.replace("/404");
    }
  }, [allowedRoles, isInitializing, profile, router]);

  if (isInitializing || !profile || !allowedRoles.includes(profile.role)) {
    return <LoadingShell label={loadingLabel} message={loadingMessage} variant="backoffice" />;
  }

  return <>{children}</>;
}
