"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Check, Edit3, MapPin, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createUserAddress,
  deleteUserAddress,
  listUserAddresses,
  setDefaultUserAddress,
  updateUserAddress,
} from "@/lib/api/services/user-addresses.service";
import { getWardsByProvinceCode, provinceOptions } from "@/lib/address/vietnam-locations";
import type { UserAddress } from "@/lib/user-address/types";
import { useAuth } from "@/components/providers/AuthProvider";

type AddressFormValue = {
  label: string;
  name: string;
  phoneNumber: string;
  provinceCode: string;
  wardCode: string;
  streetAddress: string;
  note: string;
  status: boolean;
};

type SelectOption = {
  code: string;
  name: string;
};

type LocationSelectId = "province" | "ward" | null;

const EMPTY_FORM: AddressFormValue = {
  label: "",
  name: "",
  phoneNumber: "",
  provinceCode: "",
  wardCode: "",
  streetAddress: "",
  note: "",
  status: false,
};

function toFormValue(address: UserAddress): AddressFormValue {
  return {
    label: address.label,
    name: address.name,
    phoneNumber: address.phoneNumber ?? "",
    provinceCode: address.provinceCode,
    wardCode: address.wardCode,
    streetAddress: address.streetAddress,
    note: address.note ?? "",
    status: address.status,
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();
  const profileId = profile?.id;
  const addressFormRef = useRef<HTMLDivElement | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [formValue, setFormValue] = useState<AddressFormValue>(EMPTY_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [openLocationSelect, setOpenLocationSelect] = useState<LocationSelectId>(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProvince = useMemo(
    () => provinceOptions.find((province) => province.code === formValue.provinceCode) ?? null,
    [formValue.provinceCode],
  );

  const wardOptions = useMemo(() => getWardsByProvinceCode(formValue.provinceCode), [formValue.provinceCode]);
  const selectedWard = useMemo(
    () => wardOptions.find((ward) => ward.code === formValue.wardCode) ?? null,
    [formValue.wardCode, wardOptions],
  );
  const isLimitReached = addresses.length >= 5 && !editingAddressId;

  const loadAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    setErrorMessage(null);

    try {
      const response = await listUserAddresses();
      setAddresses(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách địa chỉ.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitializing && !profile) {
      router.replace("/dang-nhap");
    }
  }, [isInitializing, profile, router]);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAddresses();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAddresses, profileId]);

  function resetForm() {
    setFormValue(EMPTY_FORM);
    setEditingAddressId(null);
    setIsAddressFormOpen(false);
  }

  function scrollToAddressForm() {
    window.setTimeout(() => {
      if (!addressFormRef.current) {
        return;
      }

      const nextTop = window.scrollY + addressFormRef.current.getBoundingClientRect().top - 96;
      const scrollState = { y: window.scrollY };

      gsap.to(scrollState, {
        y: Math.max(nextTop, 0),
        duration: 0.65,
        ease: "power2.out",
        onUpdate: () => {
          window.scrollTo(0, scrollState.y);
        },
      });
    }, 80);
  }

  function startEdit(address: UserAddress) {
    setEditingAddressId(address.id);
    setFormValue(toFormValue(address));
    setIsAddressFormOpen(true);
    scrollToAddressForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLimitReached) {
      toast.warning("Bạn chỉ có thể lưu tối đa 5 địa chỉ.");
      return;
    }

    if (!selectedProvince || !selectedWard) {
      toast.warning("Vui lòng chọn tỉnh/thành phố và phường/xã.");
      return;
    }

    if (!formValue.label.trim() || !formValue.name.trim() || !formValue.streetAddress.trim()) {
      toast.warning("Vui lòng nhập nhãn, người nhận và địa chỉ cụ thể.");
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading(editingAddressId ? "Đang cập nhật địa chỉ..." : "Đang tạo địa chỉ...");

    const payload = {
      label: formValue.label.trim(),
      name: formValue.name.trim(),
      phoneNumber: formValue.phoneNumber.trim() || undefined,
      provinceCode: selectedProvince.code,
      provinceName: selectedProvince.name,
      wardCode: selectedWard.code,
      wardName: selectedWard.name,
      streetAddress: formValue.streetAddress.trim(),
      note: formValue.note.trim() || undefined,
      status: formValue.status,
    };

    try {
      if (editingAddressId) {
        await updateUserAddress(editingAddressId, payload);
      } else {
        await createUserAddress(payload);
      }
      toast.success(editingAddressId ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ.", {
        id: loadingToastId,
      });
      resetForm();
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu địa chỉ.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetDefault(addressId: string) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang đặt địa chỉ mặc định...");

    try {
      await setDefaultUserAddress(addressId);
      toast.success("Đã đặt địa chỉ mặc định.", { id: loadingToastId });
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đặt địa chỉ mặc định.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(addressId: string) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang xóa địa chỉ...");

    try {
      await deleteUserAddress(addressId);
      toast.success("Đã xóa địa chỉ.", { id: loadingToastId });
      if (editingAddressId === addressId) {
        resetForm();
      }
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa địa chỉ.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isInitializing || !profile) {
    return (
      <main className="border-t border-border bg-background">
        <section className="container mx-auto px-4 py-10 lg:py-12">
          <div className="border border-border p-8 text-sm text-muted-foreground">Đang tải hồ sơ...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tài khoản người dùng
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">Hồ sơ của tôi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý thông tin tài khoản và địa chỉ giao hàng dùng cho checkout.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit border border-border bg-muted/15 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Thông tin</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{profile.fullName}</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-semibold">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Số điện thoại</dt>
                <dd className="font-semibold">{profile.phoneNumber ?? "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vai trò</dt>
                <dd className="font-semibold">{profile.role}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ngày tạo</dt>
                <dd className="font-semibold">{new Date(profile.createdAt).toLocaleDateString("vi-VN")}</dd>
              </div>
            </dl>
          </aside>

          <div className="grid gap-6">
            <section className="border border-border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
                <div>
                  <h2 className="text-base font-black tracking-tight">Địa chỉ giao hàng</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{addresses.length}/5 địa chỉ đã lưu.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLimitReached}
                  onClick={() => {
                    if (isLimitReached) {
                      toast.warning("Bạn chỉ có thể lưu tối đa 5 địa chỉ.");
                      return;
                    }
                    resetForm();
                    setProvinceSearch("");
                    setWardSearch("");
                    setOpenLocationSelect(null);
                    setIsAddressFormOpen(true);
                    scrollToAddressForm();
                  }}
                >
                  <Plus className="size-4" />
                  Thêm địa chỉ
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="p-5 text-sm text-muted-foreground">Đang tải địa chỉ...</div>
              ) : errorMessage ? (
                <div className="p-5 text-sm text-destructive">{errorMessage}</div>
              ) : addresses.length === 0 ? (
                <div className="grid min-h-64 place-items-center p-6 text-center">
                  <div>
                    <MapPin className="mx-auto size-10 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-black tracking-tight">Chưa có địa chỉ giao hàng</h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Thêm địa chỉ đầu tiên để hệ thống chọn sẵn khi bạn vào checkout.
                    </p>
                    <button
                      type="button"
                      className="mt-5 inline-flex h-12 items-center justify-center gap-2 border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      onClick={() => {
                        resetForm();
                        setProvinceSearch("");
                        setWardSearch("");
                        setOpenLocationSelect(null);
                        setIsAddressFormOpen(true);
                        scrollToAddressForm();
                      }}
                    >
                      <Plus className="size-4" />
                      Thêm địa chỉ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 p-4 md:p-5">
                  {addresses.map((address) => (
                    <article key={address.id} className="border border-border bg-background p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black tracking-tight">{address.label}</h3>
                            {address.status ? (
                              <span className="inline-flex items-center gap-1 border border-primary bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                                <Star className="size-3" />
                                Mặc định
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-semibold">{address.name}</p>
                          <p className="text-sm text-muted-foreground">{address.phoneNumber || "Chưa có số điện thoại"}</p>
                          <p className="mt-2 text-sm">
                            {address.streetAddress}, {address.wardName}, {address.provinceName}
                          </p>
                          {address.note ? <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {address.note}</p> : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!address.status ? (
                            <button
                              type="button"
                              className="inline-flex size-9 items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={isSubmitting}
                              onClick={() => void handleSetDefault(address.id)}
                              aria-label="Đặt mặc định"
                            >
                              <Check className="size-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex size-9 items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isSubmitting}
                            onClick={() => startEdit(address)}
                            aria-label="Sửa địa chỉ"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-9 items-center justify-center border border-border text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isSubmitting}
                            onClick={() => void handleDelete(address.id)}
                            aria-label="Xóa địa chỉ"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {isAddressFormOpen ? (
              <div ref={addressFormRef}>
                <AddressForm
                  editingAddressId={editingAddressId}
                  formValue={formValue}
                  isLimitReached={isLimitReached}
                  isSubmitting={isSubmitting}
                  onCancel={resetForm}
                  onChange={setFormValue}
                  onOpenLocationSelectChange={setOpenLocationSelect}
                  onProvinceSearchChange={setProvinceSearch}
                  onSubmit={handleSubmit}
                  onWardSearchChange={setWardSearch}
                  openLocationSelect={openLocationSelect}
                  provinceSearch={provinceSearch}
                  wardSearch={wardSearch}
                  wardOptions={wardOptions}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function AddressForm({
  editingAddressId,
  formValue,
  isLimitReached,
  isSubmitting,
  onCancel,
  onChange,
  onOpenLocationSelectChange,
  onProvinceSearchChange,
  onSubmit,
  onWardSearchChange,
  openLocationSelect,
  provinceSearch,
  wardSearch,
  wardOptions,
}: {
  editingAddressId: string | null;
  formValue: AddressFormValue;
  isLimitReached: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (value: AddressFormValue) => void;
  onOpenLocationSelectChange: (value: LocationSelectId) => void;
  onProvinceSearchChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onWardSearchChange: (value: string) => void;
  provinceSearch: string;
  wardSearch: string;
  wardOptions: SelectOption[];
  openLocationSelect: LocationSelectId;
}) {
  const filteredProvinceOptions = useMemo(
    () => filterOptions(provinceOptions, provinceSearch),
    [provinceSearch],
  );
  const filteredWardOptions = useMemo(
    () => filterOptions(wardOptions, wardSearch),
    [wardOptions, wardSearch],
  );

  return (
    <form className="border border-border bg-background p-4 md:p-5" onSubmit={onSubmit}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black tracking-tight">
            {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Chỉ lưu tỉnh/thành phố và phường/xã, không gửi district.</p>
        </div>
        {editingAddressId ? (
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary"
            onClick={onCancel}
            aria-label="Hủy chỉnh sửa"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-muted/10 p-4">
          <h3 className="text-sm font-black tracking-tight">Thông tin người nhận</h3>
          <div className="mt-4 grid gap-4">
            <TextField label="Nhãn địa chỉ" required value={formValue.label} onChange={(value) => onChange({ ...formValue, label: value })} placeholder="Nhà riêng, Công ty..." />
            <TextField label="Người nhận" required value={formValue.name} onChange={(value) => onChange({ ...formValue, name: value })} />
            <TextField label="Số điện thoại" value={formValue.phoneNumber} onChange={(value) => onChange({ ...formValue, phoneNumber: value })} />
            <TextField
              label="Ghi chú"
              value={formValue.note}
              onChange={(value) => onChange({ ...formValue, note: value })}
              placeholder="Giao giờ hành chính..."
            />
          </div>
        </section>

        <section className="border border-border bg-muted/10 p-4">
          <h3 className="text-sm font-black tracking-tight">Địa chỉ</h3>
          <div className="mt-4 grid gap-4">
            <SearchableLocationSelect
              label="Tỉnh/thành phố"
              isOpen={openLocationSelect === "province"}
              options={filteredProvinceOptions}
              placeholder="Tìm tỉnh/thành phố..."
              required
              searchValue={provinceSearch}
              selectedCode={formValue.provinceCode}
              allOptions={provinceOptions}
              onOpenChange={(isOpen) => onOpenLocationSelectChange(isOpen ? "province" : null)}
              onSearchChange={onProvinceSearchChange}
              onSelect={(province) => {
                onChange({ ...formValue, provinceCode: province.code, wardCode: "" });
                onProvinceSearchChange("");
                onWardSearchChange("");
                onOpenLocationSelectChange(null);
              }}
            />

            <SearchableLocationSelect
              disabled={!formValue.provinceCode}
              isOpen={openLocationSelect === "ward"}
              label="Phường/xã"
              options={filteredWardOptions}
              placeholder="Tìm phường/xã..."
              required
              searchValue={wardSearch}
              selectedCode={formValue.wardCode}
              allOptions={wardOptions}
              onOpenChange={(isOpen) => onOpenLocationSelectChange(isOpen ? "ward" : null)}
              onSearchChange={onWardSearchChange}
              onSelect={(ward) => {
                onChange({ ...formValue, wardCode: ward.code });
                onWardSearchChange("");
                onOpenLocationSelectChange(null);
              }}
            />

            <TextField
              label="Số nhà, tên đường"
              required
              value={formValue.streetAddress}
              onChange={(value) => onChange({ ...formValue, streetAddress: value })}
              placeholder="VD: 123 Nguyễn Huệ"
            />
          </div>
        </section>
      </div>

      <label className="mt-4 flex items-center gap-3 border border-border p-3 text-sm">
        <input
          type="checkbox"
          checked={formValue.status}
          onChange={(event) => onChange({ ...formValue, status: event.target.checked })}
        />
        <span className="font-semibold">Đặt làm địa chỉ mặc định</span>
      </label>

      <button
        type="submit"
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSubmitting || isLimitReached}
      >
        <MapPin className="size-4" />
        {editingAddressId ? "Lưu thay đổi" : "Thêm địa chỉ"}
      </button>
    </form>
  );
}

function TextField({
  className = "",
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type="text"
        value={value}
      />
    </label>
  );
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filterOptions(options: SelectOption[], searchValue: string) {
  const keyword = normalizeSearchText(searchValue.trim());

  if (!keyword) {
    return options;
  }

  return options.filter((option) => normalizeSearchText(option.name).includes(keyword));
}

function SearchableLocationSelect({
  allOptions,
  disabled = false,
  isOpen,
  label,
  onOpenChange,
  onSearchChange,
  onSelect,
  options,
  placeholder,
  required = false,
  searchValue,
  selectedCode,
}: {
  allOptions: SelectOption[];
  disabled?: boolean;
  isOpen: boolean;
  label: string;
  onOpenChange: (isOpen: boolean) => void;
  onSearchChange: (value: string) => void;
  onSelect: (option: SelectOption) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
  searchValue: string;
  selectedCode: string;
}) {
  const selectedOption = allOptions.find((option) => option.code === selectedCode);

  return (
    <div className="relative grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between gap-3 border border-border bg-background px-3 text-left outline-none transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className={selectedOption ? "font-semibold" : "text-muted-foreground"}>
          {selectedOption?.name ?? `Chọn ${label.toLowerCase()}`}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{selectedOption?.code ?? ""}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 border border-border bg-background">
          <input
            className="h-11 w-full border-b border-border bg-background px-3 outline-none focus:bg-muted/20"
            autoFocus
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            type="text"
            value={searchValue}
          />
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">Không có kết quả phù hợp.</p>
            ) : (
              options.slice(0, 80).map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={[
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    selectedCode === option.code ? "bg-muted font-semibold text-primary" : "",
                  ].join(" ")}
                  onClick={() => onSelect(option)}
                >
                  <span>{option.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{option.code}</span>
                </button>
              ))
            )}
          </div>
          {options.length > 80 ? (
            <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
              Đang hiển thị 80 kết quả đầu. Nhập thêm để lọc chính xác hơn.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
