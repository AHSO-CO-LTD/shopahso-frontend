"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Check, Edit3, MapPin, Plus, Save, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  createUserAddress,
  deleteUserAddress,
  listUserAddresses,
  setDefaultUserAddress,
  updateUserAddress,
} from "@/lib/api/services/user-addresses.service";
import { getWardsByProvinceCode, provinceOptions } from "@/lib/address/vietnam-locations";
import type { AuthProfile, UpdateProfilePayload } from "@/lib/auth/types";
import type { UserAddress } from "@/lib/user-address/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

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

type ProfileFormValue = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
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

function toProfileFormValue(profile: AuthProfile): ProfileFormValue {
  return {
    fullName: profile.fullName ?? "",
    dateOfBirth: formatDateForInput(profile.dateOfBirth),
    phoneNumber: profile.phoneNumber ?? "",
  };
}

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
  const { isInitializing, profile, updateProfile } = useAuth();
  const profileId = profile?.id;
  const addressFormRef = useRef<HTMLDivElement | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [formValue, setFormValue] = useState<AddressFormValue>(EMPTY_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [openLocationSelect, setOpenLocationSelect] = useState<LocationSelectId>(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [deletingAddress, setDeletingAddress] = useState<UserAddress | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
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

  function handleOpenCreateAddress() {
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
  }

  function validateAddressForm() {
    if (isLimitReached) {
      toast.warning("Bạn chỉ có thể lưu tối đa 5 địa chỉ.");
      return false;
    }

    if (!selectedProvince || !selectedWard) {
      toast.warning("Vui lòng chọn tỉnh/thành phố và phường/xã.");
      return false;
    }

    if (!formValue.label.trim() || !formValue.name.trim() || !formValue.streetAddress.trim()) {
      toast.warning("Vui lòng nhập nhãn, người nhận và địa chỉ cụ thể.");
      return false;
    }

    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateAddressForm()) {
      return;
    }

    setIsSaveConfirmOpen(true);
  }

  async function handleConfirmSaveAddress() {
    if (!validateAddressForm()) {
      setIsSaveConfirmOpen(false);
      return;
    }

    if (!selectedProvince || !selectedWard) {
      setIsSaveConfirmOpen(false);
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
      setIsSaveConfirmOpen(false);
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
      setDeletingAddress(null);
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
    return <LoadingProfileView />;
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 lg:py-12">
        <ProfilePageHeader />

        <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <UserInfoPanel
            isProfileEditorOpen={isProfileEditorOpen}
            profile={profile}
            onToggleProfileEditor={() => setIsProfileEditorOpen((currentValue) => !currentValue)}
          />
          <div className="grid gap-4 sm:gap-6">
            {isProfileEditorOpen ? (
              <ProfileSettingsSection
                key={`${profile.id}-${profile.updatedAt}`}
                profile={profile}
                onCancel={() => setIsProfileEditorOpen(false)}
                onUpdated={() => setIsProfileEditorOpen(false)}
                onUpdateProfile={updateProfile}
              />
            ) : null}

            <AddressBookSection
              addresses={addresses}
              errorMessage={errorMessage}
              isLimitReached={isLimitReached}
              isLoadingAddresses={isLoadingAddresses}
              isSubmitting={isSubmitting}
              onCreateAddress={handleOpenCreateAddress}
              onEditAddress={startEdit}
              onRequestDeleteAddress={setDeletingAddress}
              onSetDefaultAddress={handleSetDefault}
            />

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
      <ConfirmModal
        open={Boolean(deletingAddress)}
        title="Xóa địa chỉ giao hàng?"
        description={
          deletingAddress
            ? `Địa chỉ "${deletingAddress.label}" sẽ bị xóa khỏi hồ sơ của bạn. Hành động này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa địa chỉ"
        cancelText="Giữ lại"
        isLoading={isSubmitting}
        onCancel={() => setDeletingAddress(null)}
        onConfirm={() => {
          if (!deletingAddress) {
            return;
          }

          void handleDelete(deletingAddress.id);
        }}
      />
      <ConfirmModal
        open={isSaveConfirmOpen}
        title={editingAddressId ? "Lưu thay đổi địa chỉ?" : "Thêm địa chỉ mới?"}
        description={
          editingAddressId
            ? "Hệ thống sẽ cập nhật địa chỉ giao hàng này trong hồ sơ của bạn."
            : "Hệ thống sẽ lưu địa chỉ này để bạn có thể chọn nhanh khi checkout."
        }
        confirmText={editingAddressId ? "Lưu thay đổi" : "Thêm địa chỉ"}
        cancelText="Kiểm tra lại"
        confirmVariant="default"
        isLoading={isSubmitting}
        onCancel={() => setIsSaveConfirmOpen(false)}
        onConfirm={() => void handleConfirmSaveAddress()}
      />
    </main>
  );
}

function LoadingProfileView() {
  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 lg:py-12">
        <div className="mb-5 max-w-2xl sm:mb-8">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="mt-2 h-7 w-48 sm:h-9 sm:w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <div className="border border-border bg-muted/15 p-3 sm:p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-6 w-48 sm:h-7" />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full sm:h-10" />
              ))}
            </div>
          </div>
          <div className="border border-border bg-background p-3 sm:p-5">
            <Skeleton className="h-5 w-40" />
            <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full sm:h-24" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfilePageHeader() {
  return (
    <header className="mb-4 max-w-3xl sm:mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Tài khoản người dùng
      </p>
      <h1 className="mt-1 text-xl font-black tracking-tight sm:mt-2 sm:text-3xl lg:text-4xl">Hồ sơ của tôi</h1>
      <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:block">
        Quản lý thông tin tài khoản và địa chỉ giao hàng dùng cho checkout.
      </p>
    </header>
  );
}

function UserInfoPanel({
  isProfileEditorOpen,
  onToggleProfileEditor,
  profile,
}: {
  isProfileEditorOpen: boolean;
  onToggleProfileEditor: () => void;
  profile: AuthProfile;
}) {
  const profileRows = [
    { label: "Email", value: profile.email },
    { label: "Số điện thoại", value: profile.phoneNumber ?? "Chưa cập nhật" },
    { label: "Ngày sinh", value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật" },
    { label: "Ngày tạo", value: new Date(profile.createdAt).toLocaleDateString("vi-VN") },
  ];

  return (
    <aside className="h-fit border border-border bg-muted/15 p-3 sm:p-5 xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">Thông tin</p>
          <h2 className="mt-1 break-words text-lg font-black tracking-tight sm:mt-2 sm:text-2xl xl:text-xl">
            {profile.fullName || "Chưa cập nhật họ tên"}
          </h2>
        </div>
        <Button
          type="button"
          variant={isProfileEditorOpen ? "default" : "outline"}
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer rounded-none"
          onClick={onToggleProfileEditor}
          aria-label={isProfileEditorOpen ? "Ẩn chỉnh sửa hồ sơ" : "Chỉnh sửa hồ sơ"}
        >
          {isProfileEditorOpen ? <X className="size-4" /> : <Edit3 className="size-4" />}
        </Button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:mt-5 sm:gap-3 sm:text-sm xl:grid-cols-1">
        {profileRows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "min-w-0 border border-border bg-background/60 p-2",
              row.label === "Email" ? "col-span-2 xl:col-span-1" : "",
            )}
          >
            <dt className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">
              {row.label}
            </dt>
            <dd className="mt-1 break-words font-semibold leading-5">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function ProfileSettingsSection({
  onCancel,
  onUpdated,
  onUpdateProfile,
  profile,
}: {
  onCancel: () => void;
  onUpdated: () => void;
  onUpdateProfile: (payload: UpdateProfilePayload) => Promise<AuthProfile>;
  profile: AuthProfile;
}) {
  const [formValue, setFormValue] = useState<ProfileFormValue>(() => toProfileFormValue(profile));
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValue, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const originalValue = useMemo(() => toProfileFormValue(profile), [profile]);
  const isDirty =
    originalValue.fullName !== formValue.fullName ||
    originalValue.dateOfBirth !== formValue.dateOfBirth ||
    originalValue.phoneNumber !== formValue.phoneNumber;

  function validateForm(values: ProfileFormValue) {
    const nextErrors: Partial<Record<keyof ProfileFormValue, string>> = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    }

    if (!values.dateOfBirth) {
      nextErrors.dateOfBirth = "Vui lòng chọn ngày sinh.";
    }

    if (values.phoneNumber.trim() && !/^\+?[0-9]{9,15}$/.test(values.phoneNumber.trim())) {
      nextErrors.phoneNumber = "Số điện thoại chưa đúng định dạng.";
    }

    return nextErrors;
  }

  function updateField(field: keyof ProfileFormValue, value: string) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(formValue);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.warning("Vui lòng kiểm tra lại thông tin hồ sơ.");
      return;
    }

    if (!isDirty) {
      toast.warning("Thông tin hồ sơ chưa có thay đổi.");
      return;
    }

    const loadingToastId = toast.loading("Đang cập nhật hồ sơ...");

    try {
      setIsSubmitting(true);
      await onUpdateProfile({
        dateOfBirth: toIsoDate(formValue.dateOfBirth),
        fullName: formValue.fullName.trim(),
        phoneNumber: formValue.phoneNumber.trim() || undefined,
      });
      toast.success("Đã cập nhật hồ sơ.", { id: loadingToastId });
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border px-3 py-3 sm:px-5 sm:py-4">
        <h2 className="text-base font-black tracking-tight">Thông tin cá nhân</h2>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">
          Cập nhật thông tin dùng cho hồ sơ và checkout.
        </p>
      </div>

      <form className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5" onSubmit={handleSubmit}>
        <TextField
          autoComplete="name"
          error={errors.fullName}
          label="Họ và tên"
          required
          value={formValue.fullName}
          onChange={(value) => updateField("fullName", value)}
        />
        <TextField
          autoComplete="bday"
          error={errors.dateOfBirth}
          label="Ngày sinh"
          required
          type="date"
          value={formValue.dateOfBirth}
          onChange={(value) => updateField("dateOfBirth", value)}
        />
        <TextField
          autoComplete="tel"
          error={errors.phoneNumber}
          label="Số điện thoại"
          placeholder="+84901234567"
          type="tel"
          value={formValue.phoneNumber}
          onChange={(value) => updateField("phoneNumber", value)}
        />
        <TextField
          disabled
          hint="Email đăng ký không thể thay đổi."
          label="Email"
          type="email"
          value={profile.email}
          onChange={() => undefined}
        />
        <div className="sm:col-span-2">
          <div className="grid gap-2 sm:flex sm:items-center">
            <Button
              type="submit"
              className="h-10 w-full cursor-pointer rounded-none px-4 text-sm font-semibold sm:h-11 sm:w-auto sm:min-w-44"
              disabled={isSubmitting || !isDirty}
            >
              <Save className="size-4" />
              {isSubmitting ? "Đang lưu" : "Lưu hồ sơ"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full cursor-pointer rounded-none px-4 text-sm font-semibold sm:h-11 sm:w-auto"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              <X className="size-4" />
              Hủy
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

function AddressBookSection({
  addresses,
  errorMessage,
  isLimitReached,
  isLoadingAddresses,
  isSubmitting,
  onCreateAddress,
  onEditAddress,
  onRequestDeleteAddress,
  onSetDefaultAddress,
}: {
  addresses: UserAddress[];
  errorMessage: string | null;
  isLimitReached: boolean;
  isLoadingAddresses: boolean;
  isSubmitting: boolean;
  onCreateAddress: () => void;
  onEditAddress: (address: UserAddress) => void;
  onRequestDeleteAddress: (address: UserAddress) => void;
  onSetDefaultAddress: (addressId: string) => Promise<void>;
}) {
  return (
    <section className="border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="text-base font-black tracking-tight">Địa chỉ giao hàng</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">{addresses.length}/5 địa chỉ đã lưu.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-8 shrink-0 cursor-pointer rounded-none px-2 text-xs font-semibold sm:h-10 sm:px-3"
          disabled={isLimitReached}
          onClick={onCreateAddress}
        >
          <Plus className="size-4" />
          <span className="hidden min-[390px]:inline">Thêm địa chỉ</span>
          <span className="min-[390px]:hidden">Thêm</span>
        </Button>
      </div>

      {isLoadingAddresses ? (
        <AddressListSkeleton />
      ) : errorMessage ? (
        <div className="p-3 text-sm text-destructive sm:p-5">{errorMessage}</div>
      ) : addresses.length === 0 ? (
        <EmptyAddressState onCreateAddress={onCreateAddress} />
      ) : (
        <div className="grid gap-2 p-2 sm:gap-3 sm:p-5">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSubmitting={isSubmitting}
              onEditAddress={onEditAddress}
              onRequestDeleteAddress={onRequestDeleteAddress}
              onSetDefaultAddress={onSetDefaultAddress}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AddressListSkeleton() {
  return (
    <div className="grid gap-2 p-2 sm:gap-3 sm:p-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border border-border p-3 sm:p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </div>
      ))}
    </div>
  );
}

function EmptyAddressState({ onCreateAddress }: { onCreateAddress: () => void }) {
  return (
    <div className="grid min-h-44 place-items-center p-4 text-center sm:min-h-64 sm:p-8">
      <div className="max-w-md">
        <MapPin className="mx-auto size-8 text-muted-foreground sm:size-10" />
        <h3 className="mt-3 text-base font-black tracking-tight sm:mt-4 sm:text-xl">Chưa có địa chỉ giao hàng</h3>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6">
          Thêm địa chỉ đầu tiên để hệ thống chọn sẵn khi bạn vào checkout.
        </p>
        <Button
          type="button"
          className="mt-4 h-9 w-full cursor-pointer rounded-none px-4 text-xs font-semibold sm:mt-5 sm:h-11 sm:w-auto sm:px-5 sm:text-sm"
          onClick={onCreateAddress}
        >
          <Plus className="size-4" />
          Thêm địa chỉ
        </Button>
      </div>
    </div>
  );
}

function AddressCard({
  address,
  isSubmitting,
  onEditAddress,
  onRequestDeleteAddress,
  onSetDefaultAddress,
}: {
  address: UserAddress;
  isSubmitting: boolean;
  onEditAddress: (address: UserAddress) => void;
  onRequestDeleteAddress: (address: UserAddress) => void;
  onSetDefaultAddress: (addressId: string) => Promise<void>;
}) {
  return (
    <article className="border border-border bg-background p-3 transition-colors hover:border-primary/60 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 truncate font-black tracking-tight">{address.label}</h3>
            {address.status ? (
              <span className="inline-flex shrink-0 items-center gap-1 border border-primary bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground sm:py-1 sm:text-[11px]">
                <Star className="size-3" />
                Mặc định
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 break-words text-sm font-semibold">
            {address.name}
            <span className="font-normal text-muted-foreground"> · {address.phoneNumber || "Chưa có số điện thoại"}</span>
          </p>
          <p className="mt-1.5 break-words text-xs leading-5 sm:text-sm sm:leading-6">
            {address.streetAddress}, {address.wardName}, {address.provinceName}
          </p>
          {address.note ? <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">Ghi chú: {address.note}</p> : null}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {!address.status ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-full cursor-pointer rounded-none sm:w-8"
              disabled={isSubmitting}
              onClick={() => void onSetDefaultAddress(address.id)}
              aria-label="Đặt mặc định"
            >
              <Check className="size-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("h-8 w-full cursor-pointer rounded-none sm:w-8", address.status ? "col-start-2" : "")}
            disabled={isSubmitting}
            onClick={() => onEditAddress(address)}
            aria-label="Sửa địa chỉ"
          >
            <Edit3 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-8 w-full cursor-pointer rounded-none sm:w-8"
            disabled={isSubmitting}
            onClick={() => onRequestDeleteAddress(address)}
            aria-label="Xóa địa chỉ"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
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
    <form className="border border-border bg-background p-3 sm:p-5" onSubmit={onSubmit}>
      <div className="mb-4 grid gap-2 sm:mb-5 sm:flex sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-black tracking-tight">
            {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
          </h2>
          <p className="mt-1 hidden text-xs leading-5 text-muted-foreground sm:block">Chỉ lưu tỉnh/thành phố và phường/xã, không gửi district.</p>
        </div>
        {editingAddressId ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 cursor-pointer rounded-none sm:h-9"
            onClick={onCancel}
            aria-label="Hủy chỉnh sửa"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        <fieldset className="min-w-0 border border-border bg-muted/10 p-3 sm:p-4">
          <legend className="px-1 text-xs font-black tracking-tight sm:text-sm">Thông tin người nhận</legend>
          <div className="mt-3 grid gap-3 min-[420px]:grid-cols-2 sm:mt-4 sm:gap-4">
            <TextField label="Nhãn địa chỉ" required value={formValue.label} onChange={(value) => onChange({ ...formValue, label: value })} placeholder="Nhà riêng, Công ty..." />
            <TextField label="Người nhận" required value={formValue.name} onChange={(value) => onChange({ ...formValue, name: value })} />
            <TextField label="Số điện thoại" value={formValue.phoneNumber} onChange={(value) => onChange({ ...formValue, phoneNumber: value })} />
            <TextField
              className="col-span-2 sm:col-span-1"
              label="Ghi chú"
              value={formValue.note}
              onChange={(value) => onChange({ ...formValue, note: value })}
              placeholder="Giao giờ hành chính..."
            />
          </div>
        </fieldset>

        <fieldset className="min-w-0 border border-border bg-muted/10 p-3 sm:p-4">
          <legend className="px-1 text-xs font-black tracking-tight sm:text-sm">Địa chỉ</legend>
          <div className="mt-3 grid gap-3 min-[560px]:grid-cols-2 sm:mt-4 sm:gap-4">
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
              className="min-[560px]:col-span-2"
              label="Số nhà, tên đường"
              required
              value={formValue.streetAddress}
              onChange={(value) => onChange({ ...formValue, streetAddress: value })}
              placeholder="VD: 123 Nguyễn Huệ"
            />
          </div>
        </fieldset>
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 border border-border p-2.5 text-sm transition-colors hover:border-primary/70 sm:mt-4 sm:gap-3 sm:p-3">
        <input
          className="size-4 accent-primary"
          type="checkbox"
          checked={formValue.status}
          onChange={(event) => onChange({ ...formValue, status: event.target.checked })}
        />
        <span className="font-semibold">Đặt làm địa chỉ mặc định</span>
      </label>

      <Button
        type="submit"
        className="mt-4 h-10 w-full cursor-pointer rounded-none px-4 text-sm font-semibold sm:mt-5 sm:h-11 sm:w-auto sm:min-w-44"
        disabled={isSubmitting || isLimitReached}
      >
        <MapPin className="size-4" />
        {editingAddressId ? "Lưu thay đổi" : "Thêm địa chỉ"}
      </Button>
    </form>
  );
}

function TextField({
  autoComplete,
  className = "",
  disabled = false,
  error,
  hint,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string | null | undefined;
}) {
  const normalizedValue = value ?? "";

  return (
    <label className={cn("grid min-w-0 gap-1.5 text-sm sm:gap-2", className)}>
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        autoComplete={autoComplete}
        className={cn(
          "h-10 min-w-0 border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 sm:h-11",
          disabled ? "cursor-not-allowed bg-muted/20 text-muted-foreground" : "",
          error ? "border-destructive focus:border-destructive focus:ring-destructive/15" : "",
        )}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={normalizedValue}
      />
      {hint ? <span className="text-xs leading-5 text-muted-foreground">{hint}</span> : null}
      {error ? <span className="text-xs leading-5 text-destructive">{error}</span> : null}
    </label>
  );
}

function formatDateForInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
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
    <div className="relative grid min-w-0 gap-1.5 text-sm sm:gap-2">
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">
        {label}
        {required ? " *" : ""}
      </span>
      <Button
        type="button"
        variant="outline"
        className="h-10 min-w-0 overflow-hidden w-full cursor-pointer justify-between gap-2 rounded-none px-3 text-left text-sm font-normal hover:border-primary sm:h-11 sm:gap-3"
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className={cn("min-w-0 truncate", selectedOption ? "font-semibold" : "text-muted-foreground")}>
          {selectedOption?.name ?? `Chọn ${label.toLowerCase()}`}
        </span>
        <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground min-[520px]:inline">{selectedOption?.code ?? ""}</span>
      </Button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 border border-border bg-background">
          <input
            className="h-10 w-full border-b border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:bg-muted/20 focus:ring-2 focus:ring-primary/15 sm:h-11"
            autoFocus
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            type="text"
            value={searchValue}
          />
          <div className="max-h-48 overflow-y-auto sm:max-h-56">
            {options.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">Không có kết quả phù hợp.</p>
            ) : (
              options.slice(0, 80).map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={[
                    "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted sm:py-2",
                    selectedCode === option.code ? "bg-muted font-semibold text-primary" : "",
                  ].join(" ")}
                  onClick={() => onSelect(option)}
                >
                  <span className="min-w-0 break-words">{option.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{option.code}</span>
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
