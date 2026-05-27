import styles from "@/components/storefront/ProductDescriptionRenderer.module.css";

type ProductDescriptionRendererProps = {
  html: string | null | undefined;
  emptyText?: string;
};

export default function ProductDescriptionRenderer({
  html,
  emptyText = "Sản phẩm chưa có mô tả.",
}: ProductDescriptionRendererProps) {
  const normalizedHtml = html?.trim();

  if (!normalizedHtml) {
    return <p className="px-4 py-4 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div
      className={`${styles.description} px-4 py-4`}
      dangerouslySetInnerHTML={{ __html: normalizedHtml }}
    />
  );
}
