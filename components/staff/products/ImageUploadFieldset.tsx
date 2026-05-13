"use client";

import { useId, useState, type DragEvent } from "react";
import { ImageIcon, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type ExistingImageItem = {
  publicId: string;
  url?: string | null;
};

type ImageUploadFieldsetProps = {
  title: string;
  description: string;
  existingImages?: ExistingImageItem[];
  emptyExistingText?: string;
  selectedFiles: File[];
  selectedPreviewUrls: string[];
  isUploading: boolean;
  deletingPublicId?: string | null;
  uploadButtonText: string;
  onSelectFiles: (files: File[]) => void;
  onClearSelected: () => void;
  onUploadSelected: () => void;
  onDeleteExistingImage?: (publicId: string) => void;
};

export default function ImageUploadFieldset({
  title,
  description,
  existingImages = [],
  emptyExistingText = "Chưa có ảnh.",
  selectedFiles,
  selectedPreviewUrls,
  isUploading,
  deletingPublicId = null,
  uploadButtonText,
  onSelectFiles,
  onClearSelected,
  onUploadSelected,
  onDeleteExistingImage,
}: ImageUploadFieldsetProps) {
  const fileInputId = useId();
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    if (isUploading) {
      return;
    }

    const droppedFiles = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (droppedFiles.length > 0) {
      onSelectFiles(droppedFiles);
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <section className="space-y-4 border border-border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-black tracking-tight">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <p className="text-sm font-medium text-foreground">Tải ảnh từ thiết bị</p>
      </div>

      <div
        className={`flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed px-4 py-8 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">Kéo và thả ảnh vào đây</p>
          <p className="text-sm text-muted-foreground">Hỗ trợ PNG/JPG/WebP (khuyến nghị tối đa 5MB mỗi ảnh)</p>
        </div>

        <input
          accept="image/*"
          className="sr-only"
          id={fileInputId}
          multiple
          onChange={(event) => onSelectFiles(Array.from(event.target.files ?? []))}
          type="file"
        />

        <Button asChild className="h-10 cursor-pointer px-4 text-sm font-semibold" type="button" variant="outline">
          <label className="inline-flex cursor-pointer items-center gap-2" htmlFor={fileInputId}>
            <Upload className="h-4 w-4" />
            Chọn ảnh
          </label>
        </Button>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ảnh đã chọn</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="space-y-2 border border-border p-2">
                <Image
                  alt={`Xem trước ảnh ${file.name}`}
                  className="h-28 w-full border border-border bg-muted/20 object-contain"
                  height={112}
                  src={selectedPreviewUrls[index] ?? ""}
                  unoptimized
                  width={240}
                />
                <p className="truncate text-xs text-muted-foreground">{file.name}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-10 cursor-pointer px-4 text-sm font-semibold"
              disabled={isUploading}
              onClick={onUploadSelected}
              type="button"
              variant="outline"
            >
              {isUploading ? "Đang tải ảnh..." : uploadButtonText}
            </Button>
            <Button
              className="h-10 cursor-pointer px-4 text-sm font-semibold"
              disabled={isUploading}
              onClick={onClearSelected}
              type="button"
              variant="ghost"
            >
              Xóa danh sách đã chọn
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ảnh hiện có</p>
        {existingImages.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyExistingText}</p>
        ) : (
          <ul className="space-y-2">
            {existingImages.map((item) => (
              <li key={item.publicId} className="flex items-center justify-between gap-3 border border-border p-2">
                <div className="flex min-w-0 items-center gap-3">
                  {item.url ? (
                    <Image
                      alt={`Ảnh ${item.publicId}`}
                      className="h-12 w-12 border border-border object-cover"
                      height={48}
                      src={item.url}
                      unoptimized
                      width={48}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center border border-border text-[10px] font-semibold text-muted-foreground">
                      Ảnh
                    </div>
                  )}
                  <span className="truncate text-xs text-muted-foreground">{item.publicId}</span>
                </div>
                {onDeleteExistingImage ? (
                  <Button
                    className="h-8 cursor-pointer px-3 text-xs font-semibold"
                    disabled={deletingPublicId === item.publicId}
                    onClick={() => onDeleteExistingImage(item.publicId)}
                    type="button"
                    variant="destructive"
                  >
                    {deletingPublicId === item.publicId ? "Đang xóa..." : "Xóa ảnh"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
