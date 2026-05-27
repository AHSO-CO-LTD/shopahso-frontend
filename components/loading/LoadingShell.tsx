import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingShellVariant = "web" | "backoffice" | "auth";

type LoadingShellProps = {
  label?: string;
  message?: string;
  variant?: LoadingShellVariant;
};

const defaultLabels: Record<LoadingShellVariant, string> = {
  auth: "Đang chuẩn bị biểu mẫu",
  backoffice: "Đang tải không gian làm việc",
  web: "Đang tải dữ liệu",
};

const defaultMessages: Record<LoadingShellVariant, string> = {
  auth: "Hệ thống đang xác minh trạng thái phiên và dựng giao diện đăng nhập.",
  backoffice: "Hệ thống đang nạp điều hướng, quyền truy cập và dữ liệu vận hành.",
  web: "ShopAHSO đang chuẩn bị nội dung và thông số kỹ thuật mới nhất.",
};

export default function LoadingShell({
  label,
  message,
  variant = "web",
}: LoadingShellProps) {
  if (variant === "backoffice") {
    return (
      <BackofficeLoadingShell
        label={label ?? defaultLabels.backoffice}
        message={message ?? defaultMessages.backoffice}
      />
    );
  }

  if (variant === "auth") {
    return <AuthLoadingShell label={label ?? defaultLabels.auth} message={message ?? defaultMessages.auth} />;
  }

  return <WebLoadingShell label={label ?? defaultLabels.web} message={message ?? defaultMessages.web} />;
}

function LoadingMeter() {
  return (
    <div aria-hidden="true" className="grid grid-cols-12 border border-border bg-background">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 border-r border-border last:border-r-0",
            index < 5 ? "animate-pulse bg-primary" : "bg-muted",
          )}
          style={{ animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  );
}

function LoadingStatus({ label, message }: Required<Pick<LoadingShellProps, "label" | "message">>) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">{label}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
      <LoadingMeter />
    </div>
  );
}

function WebLoadingShell({ label, message }: Required<Pick<LoadingShellProps, "label" | "message">>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:h-20">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 border border-border bg-muted" />
            <Skeleton className="h-6 w-32 bg-muted" />
          </div>
          <Skeleton className="hidden h-10 w-full max-w-xl border border-border bg-muted md:block" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 border border-border bg-muted" />
            <Skeleton className="hidden h-10 w-28 border border-border bg-muted sm:block" />
          </div>
        </div>
      </header>

      <main className="flex-1 border-b border-border">
        <section className="industrial-grid border-b border-border">
          <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-14">
            <LoadingStatus label={label} message={message} />
            <div className="hidden border border-border bg-background p-4 lg:block">
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-square border border-border bg-muted" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 lg:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border border-border bg-background p-4">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="mt-4 h-8 w-3/4 bg-muted" />
                <Skeleton className="mt-3 h-4 w-full bg-muted" />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-0 border border-border lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border-b border-r border-border p-4 last:border-r-0 lg:border-b-0">
                <Skeleton className="aspect-[4/3] w-full bg-muted" />
                <Skeleton className="mt-4 h-4 w-5/6 bg-muted" />
                <Skeleton className="mt-2 h-4 w-1/2 bg-muted" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function BackofficeLoadingShell({ label, message }: Required<Pick<LoadingShellProps, "label" | "message">>) {
  return (
    <section className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <aside className="hidden h-full w-[280px] border-r border-border bg-muted/25 lg:block">
          <div className="border-b border-border px-4 py-4">
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="mt-3 h-6 w-40 bg-muted" />
          </div>
          <div className="space-y-2 px-3 py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full border border-border bg-background" />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <header className="border-b border-border px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-6 w-56 bg-muted" />
              </div>
              <Skeleton className="h-10 w-36 border border-border bg-muted" />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            <div className="mb-6 max-w-3xl">
              <LoadingStatus label={label} message={message} />
            </div>

            <div className="grid gap-0 border border-border md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border-b border-r border-border p-5 last:border-r-0 md:border-b-0">
                  <Skeleton className="h-3 w-24 bg-muted" />
                  <Skeleton className="mt-4 h-8 w-28 bg-muted" />
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="border border-border">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid gap-3 border-b border-border p-4 last:border-b-0 sm:grid-cols-[1fr_120px_120px] sm:gap-4"
                  >
                    <Skeleton className="h-5 w-full bg-muted" />
                    <Skeleton className="h-5 w-full bg-muted" />
                    <Skeleton className="h-5 w-full bg-muted" />
                  </div>
                ))}
              </div>
              <div className="border border-border p-5">
                <Skeleton className="h-5 w-32 bg-muted" />
                <Skeleton className="mt-5 h-24 w-full bg-muted" />
                <Skeleton className="mt-4 h-10 w-full bg-muted" />
                <Skeleton className="mt-3 h-10 w-2/3 bg-muted" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

function AuthLoadingShell({ label, message }: Required<Pick<LoadingShellProps, "label" | "message">>) {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center border-t border-border bg-background">
      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-stretch">
        <div className="border border-border bg-muted/30 p-6 lg:p-8">
          <LoadingStatus label={label} message={message} />
          <div className="mt-8 grid gap-4 border-t border-border pt-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-4 w-20 bg-background" />
                <Skeleton className="h-4 w-full bg-background" />
                <Skeleton className="h-4 w-4/5 bg-background" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 border border-border bg-background p-6 lg:p-8">
          <Skeleton className="h-7 w-44 bg-muted" />
          <Skeleton className="h-11 w-full border border-border bg-muted" />
          <Skeleton className="h-11 w-full border border-border bg-muted" />
          <Skeleton className="h-11 w-full border border-border bg-muted" />
          <Skeleton className="h-11 w-36 bg-primary/20" />
          <Skeleton className="h-4 w-52 bg-muted" />
        </div>
      </div>
    </section>
  );
}
