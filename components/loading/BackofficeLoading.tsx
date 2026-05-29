import LoadingShell from "@/components/loading/LoadingShell";

type BackofficeLoadingProps = {
  label: string;
};

export default function BackofficeLoading({ label }: BackofficeLoadingProps) {
  return <LoadingShell label={label} variant="backoffice" />;
}
