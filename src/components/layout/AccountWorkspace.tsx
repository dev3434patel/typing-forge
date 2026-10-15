import { Fragment, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

/** An owner switch resets transient private passages, results and route UI. */
export function AccountWorkspace({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <Fragment key={user?.id ?? "guest"}>{children}</Fragment>;
}
