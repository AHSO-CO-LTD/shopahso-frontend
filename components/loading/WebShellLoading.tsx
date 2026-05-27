import LoadingShell from "@/components/loading/LoadingShell";

type WebShellLoadingProps = {
  label?: string;
};

export default function WebShellLoading({ label }: WebShellLoadingProps) {
  return <LoadingShell label={label} variant="web" />;
}
