"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  ImagePlus,
  Images,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Underline,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ProductDescriptionRenderer from "@/components/storefront/ProductDescriptionRenderer";
import {
  listBackofficeProductDescriptionImages,
  uploadBackofficeProductDescriptionImage,
} from "@/lib/api/services/products.service";
import type { ProductDescriptionAsset } from "@/lib/product/types";

const MAX_DESCRIPTION_LENGTH = 50000;
const IMAGE_SIZE_PRESETS = ["25%", "50%", "75%", "100%"];

type RichDescriptionEditorProps = {
  productId?: string;
  value: string;
  onChange: (value: string) => void;
};

type ImageAlign = "left" | "center" | "right";
type ViewMode = "edit" | "preview" | "html";

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeImageWidth(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^\d+$/.test(trimmedValue)) {
    return `${trimmedValue}px`;
  }

  if (/^\d+(\.\d+)?(px|%)$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return "";
}

function getImageWidthPresetClass(width: string) {
  return width === "25%"
    ? "image-size-small"
    : width === "50%"
      ? "image-size-medium"
      : width === "75%"
        ? "image-size-large"
        : width === "100%"
          ? "image-size-full"
          : "";
}

function ToolbarButton({
  children,
  disabled = false,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export default function RichDescriptionEditor({ productId, value, onChange }: RichDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [assets, setAssets] = useState<ProductDescriptionAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [hasSelectedImage, setHasSelectedImage] = useState(false);
  const [selectedImageWidth, setSelectedImageWidth] = useState("100%");
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!editorRef.current || viewMode !== "edit") {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, viewMode]);

  const emitEditorValue = useCallback(() => {
    const nextValue = editorRef.current?.innerHTML ?? "";
    if (nextValue.length > MAX_DESCRIPTION_LENGTH) {
      toast.warning("Mô tả sản phẩm tối đa 50000 ký tự.");
    }
    onChange(nextValue.slice(0, MAX_DESCRIPTION_LENGTH));
  }, [onChange]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitEditorValue();
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    emitEditorValue();
  };

  const insertDescriptionImage = (url: string, alt: string) => {
    insertHtml(
      `<img class="description-image image-size-full image-align-center" src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" style="width:100%;height:auto;display:block;margin-left:auto;margin-right:auto" />`,
    );
  };

  const loadAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    try {
      const response = await listBackofficeProductDescriptionImages({
        limit: 60,
        search: assetSearch.trim() || undefined,
      });
      setAssets(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải thư viện ảnh mô tả.");
    } finally {
      setIsLoadingAssets(false);
    }
  }, [assetSearch]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!productId) {
      toast.warning("Chỉ có thể upload ảnh mô tả sau khi sản phẩm đã được tạo.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Đang tải ảnh mô tả...");
    try {
      const asset = await uploadBackofficeProductDescriptionImage(productId, file);
      insertDescriptionImage(asset.url, asset.alt ?? file.name);
      toast.success("Đã chèn ảnh vào mô tả.", { id: toastId });
      if (isLibraryOpen) {
        await loadAssets();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh mô tả.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  };

  const handleCreateLink = () => {
    if (!linkText.trim()) {
      toast.warning("Chưa nhập văn bản hiển thị cho liên kết.");
      return;
    }

    if (!linkHref.trim()) {
      toast.warning("Chưa nhập URL liên kết.");
      return;
    }

    insertHtml(
      `<a class="product-link" href="${escapeAttribute(linkHref.trim())}" rel="noopener noreferrer">${escapeHtml(linkText.trim())}</a>`,
    );
    setLinkText("");
    setLinkHref("");
    setIsLinkPanelOpen(false);
    toast.success("Đã thêm liên kết vào mô tả.");
  };

  const handleToggleLinkPanel = () => {
    const selectedText = window.getSelection()?.toString().trim() ?? "";
    if (selectedText) {
      setLinkText(selectedText);
    }
    setIsLinkPanelOpen((current) => !current);
  };

  const handleToggleLibrary = () => {
    setIsLibraryOpen((current) => {
      const nextOpen = !current;
      if (nextOpen && assets.length === 0) {
        window.setTimeout(() => {
          void loadAssets();
        }, 0);
      }
      return nextOpen;
    });
  };

  const handleSelectImage = (target: EventTarget | null) => {
    if (!(target instanceof HTMLImageElement) || !editorRef.current?.contains(target)) {
      selectedImageRef.current = null;
      setHasSelectedImage(false);
      return;
    }

    target.classList.add("description-image");
    selectedImageRef.current = target;
    setHasSelectedImage(true);
    setSelectedImageWidth(target.style.width || target.getAttribute("width") || "100%");
  };

  const applyImageWidth = (nextWidth: string) => {
    const image = selectedImageRef.current;
    if (!image) {
      toast.warning("Vui lòng chọn ảnh trong mô tả trước.");
      return;
    }

    const normalizedWidth = normalizeImageWidth(nextWidth);
    if (!normalizedWidth) {
      toast.warning("Kích thước ảnh chỉ hỗ trợ px hoặc %, ví dụ 420px hoặc 50%.");
      return;
    }

    image.classList.remove("image-size-small", "image-size-medium", "image-size-large", "image-size-full");
    image.classList.add("description-image");
    const presetClass = getImageWidthPresetClass(normalizedWidth);
    if (presetClass) {
      image.classList.add(presetClass);
    }
    image.style.width = normalizedWidth;
    image.style.height = "auto";
    image.style.maxWidth = "100%";
    setSelectedImageWidth(normalizedWidth);
    emitEditorValue();
  };

  const applyImageAlign = (align: ImageAlign) => {
    const image = selectedImageRef.current;
    if (!image) {
      toast.warning("Vui lòng chọn ảnh trong mô tả trước.");
      return;
    }

    image.classList.remove("image-align-left", "image-align-center", "image-align-right");
    image.classList.add("description-image", `image-align-${align}`);
    image.style.height = "auto";
    image.style.display = "block";
    image.style.float = "none";

    if (align === "left") {
      image.style.marginLeft = "0";
      image.style.marginRight = "auto";
    } else if (align === "center") {
      image.style.marginLeft = "auto";
      image.style.marginRight = "auto";
    } else {
      image.style.marginLeft = "auto";
      image.style.marginRight = "0";
    }

    emitEditorValue();
    toast.success("Đã cập nhật căn ảnh.");
  };

  const resetSelectedImageStyle = () => {
    const image = selectedImageRef.current;
    if (!image) {
      toast.warning("Vui lòng chọn ảnh trong mô tả trước.");
      return;
    }

    image.classList.remove(
      "image-size-small",
      "image-size-medium",
      "image-size-large",
      "image-size-full",
      "image-align-left",
      "image-align-center",
      "image-align-right",
    );
    image.classList.add("description-image");
    image.removeAttribute("style");
    setSelectedImageWidth("100%");
    emitEditorValue();
    toast.success("Đã reset kích thước ảnh.");
  };

  const characterCount = value.length;
  const isOverLimit = characterCount >= MAX_DESCRIPTION_LENGTH;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton label="Đoạn văn" onClick={() => runCommand("formatBlock", "p")}>
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Tiêu đề H1" onClick={() => runCommand("formatBlock", "h1")}>
            <span className="text-xs font-black">H1</span>
          </ToolbarButton>
          <ToolbarButton label="Tiêu đề H2" onClick={() => runCommand("formatBlock", "h2")}>
            <span className="text-xs font-black">H2</span>
          </ToolbarButton>
          <ToolbarButton label="Tiêu đề H3" onClick={() => runCommand("formatBlock", "h3")}>
            <span className="text-xs font-black">H3</span>
          </ToolbarButton>
          <ToolbarButton label="In đậm" onClick={() => runCommand("bold")}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="In nghiêng" onClick={() => runCommand("italic")}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Gạch chân" onClick={() => runCommand("underline")}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Danh sách bullet" onClick={() => runCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Danh sách số" onClick={() => runCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Căn trái" onClick={() => runCommand("justifyLeft")}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Căn giữa" onClick={() => runCommand("justifyCenter")}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Căn phải" onClick={() => runCommand("justifyRight")}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Thêm liên kết" onClick={handleToggleLinkPanel}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton disabled={isUploading} label="Upload ảnh mô tả" onClick={() => uploadInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Mở thư viện ảnh" onClick={handleToggleLibrary}>
            <Images className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex border border-border p-1">
          {(["edit", "preview", "html"] as const).map((mode) => (
            <button
              key={mode}
              className={[
                "inline-flex h-8 cursor-pointer items-center gap-1 px-2 text-xs font-semibold transition-colors hover:text-primary",
                viewMode === mode ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "text-muted-foreground",
              ].join(" ")}
              onClick={() => setViewMode(mode)}
              type="button"
            >
              {mode === "edit" ? <Pilcrow className="h-3.5 w-3.5" /> : mode === "preview" ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
              {mode === "edit" ? "Soạn" : mode === "preview" ? "Preview" : "HTML"}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={uploadInputRef}
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleUpload(event.target.files?.[0])}
        type="file"
      />

      {isLinkPanelOpen ? (
        <div className="grid gap-3 border border-border bg-muted/10 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Văn bản hiển thị
            <input
              className="h-10 border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-primary"
              onChange={(event) => setLinkText(event.target.value)}
              placeholder="Xem thêm tại đây"
              type="text"
              value={linkText}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            URL liên kết
            <input
              className="h-10 border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-primary"
              onChange={(event) => setLinkHref(event.target.value)}
              placeholder="https://example.com hoặc /san-pham/slug"
              type="text"
              value={linkHref}
            />
          </label>
          <div className="grid content-end">
            <Button className="h-10 cursor-pointer px-3 text-xs font-semibold" onClick={handleCreateLink} type="button">
              Chèn liên kết
            </Button>
          </div>
        </div>
      ) : null}

      {isLibraryOpen ? (
        <div className="space-y-3 border border-border bg-muted/10 p-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              className="h-10 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              onChange={(event) => setAssetSearch(event.target.value)}
              placeholder="Tìm theo tên ảnh hoặc sản phẩm"
              type="search"
              value={assetSearch}
            />
            <Button
              className="h-10 cursor-pointer px-3 text-xs font-semibold"
              disabled={isLoadingAssets}
              onClick={() => void loadAssets()}
              type="button"
              variant="outline"
            >
              {isLoadingAssets ? "Đang tải..." : "Tìm ảnh"}
            </Button>
          </div>

          {isLoadingAssets ? (
            <p className="border border-border bg-background px-3 py-4 text-sm text-muted-foreground">Đang tải thư viện ảnh...</p>
          ) : assets.length === 0 ? (
            <p className="border border-border bg-background px-3 py-4 text-sm text-muted-foreground">Chưa có ảnh mô tả phù hợp.</p>
          ) : (
            <div className="grid max-h-80 gap-3 overflow-y-auto md:grid-cols-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  className="group cursor-pointer border border-border bg-background p-2 text-left transition-colors hover:border-primary"
                  onClick={() => {
                    insertDescriptionImage(asset.url, asset.alt ?? asset.product.name);
                    toast.success("Đã chèn ảnh từ thư viện.");
                  }}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={asset.alt ?? asset.product.name} className="aspect-[4/3] w-full border border-border object-cover" src={asset.url} />
                  <span className="mt-2 block truncate text-xs font-semibold group-hover:text-primary">{asset.alt ?? "Ảnh mô tả"}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{asset.product.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {hasSelectedImage && viewMode === "edit" ? (
        <div className="grid gap-3 border border-border bg-muted/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tinh chỉnh ảnh</p>
              <p className="mt-1 text-xs text-muted-foreground">Kéo slider hoặc chọn preset để lưu kích thước vào HTML.</p>
            </div>
            <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" onClick={resetSelectedImageStyle} type="button" variant="outline">
              Reset ảnh
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
            <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
              Kích thước theo %
              <input
                className="w-full cursor-pointer accent-primary"
                max="100"
                min="10"
                onChange={(event) => applyImageWidth(`${event.target.value}%`)}
                step="5"
                type="range"
                value={selectedImageWidth.endsWith("%") ? Number(selectedImageWidth.replace("%", "")) : 100}
              />
            </label>

            <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
              Width
              <input
                className="h-10 border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-primary"
                onBlur={(event) => applyImageWidth(event.target.value)}
                onChange={(event) => setSelectedImageWidth(event.target.value)}
                placeholder="420px hoặc 50%"
                type="text"
                value={selectedImageWidth}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Preset nhanh</span>
              <div className="grid grid-cols-4 gap-1">
                {IMAGE_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className="h-10 cursor-pointer border border-border bg-background text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                    onClick={() => applyImageWidth(preset)}
                    type="button"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" onClick={() => applyImageAlign("left")} type="button" variant="outline">
              <AlignLeft className="mr-1 h-4 w-4" />
              Trái
            </Button>
            <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" onClick={() => applyImageAlign("center")} type="button" variant="outline">
              <AlignCenter className="mr-1 h-4 w-4" />
              Giữa
            </Button>
            <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" onClick={() => applyImageAlign("right")} type="button" variant="outline">
              <AlignRight className="mr-1 h-4 w-4" />
              Phải
            </Button>
          </div>
        </div>
      ) : null}

      {viewMode === "edit" ? (
        <div
          ref={editorRef}
          aria-label="Mô tả HTML sản phẩm"
          className="min-h-72 border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary [&_a]:cursor-pointer [&_a]:font-semibold [&_a]:text-primary [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-black [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-bold [&_img]:my-3 [&_img]:max-w-full [&_img]:border [&_img]:border-border [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          contentEditable
          onClick={(event) => handleSelectImage(event.target)}
          onInput={emitEditorValue}
          role="textbox"
          suppressContentEditableWarning
        />
      ) : viewMode === "preview" ? (
        <div className="min-h-72 border border-border bg-background">
          <ProductDescriptionRenderer html={value} />
        </div>
      ) : (
        <textarea
          className="min-h-72 w-full border border-border bg-background px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-primary"
          onChange={(event) => onChange(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
          value={value}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Chỉ dùng các định dạng được backend cho phép: đoạn, H1, H2, H3, danh sách, link và ảnh.</span>
        <span className={isOverLimit ? "font-semibold text-destructive" : ""}>{characterCount}/{MAX_DESCRIPTION_LENGTH}</span>
      </div>
    </div>
  );
}
