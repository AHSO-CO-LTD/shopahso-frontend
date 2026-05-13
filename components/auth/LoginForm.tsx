"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthField } from "@/components/auth/AuthField";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

type LoginFormState = {
  email: string;
  password: string;
};

function validateLoginForm(values: LoginFormState) {
  const errors: Partial<Record<keyof LoginFormState, string>> = {};

  if (!values.email.trim()) {
    errors.email = "Vui lòng nhập email.";
  }

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  }

  return errors;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.details || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể đăng nhập. Vui lòng thử lại.";
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [values, setValues] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const updateField = (field: keyof LoginFormState, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Vui lòng kiểm tra lại thông tin đăng nhập.");
      return;
    }

    const loadingToastId = toast.loading("Đang đăng nhập...");

    try {
      setIsSubmitting(true);
      await login({
        email: values.email.trim(),
        password: values.password,
      });

      toast.success("Đăng nhập thành công.", {
        id: loadingToastId,
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error), {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">Đăng nhập</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Sử dụng email và mật khẩu để truy cập hệ thống ShopAHSO.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField
          autoComplete="email"
          error={errors.email}
          label="Email"
          name="email"
          placeholder="nhap-email@doanhnghiep.vn"
          type="email"
          value={values.email}
          onChange={(value) => updateField("email", value)}
        />
        <div className="space-y-2">
          <label htmlFor="auth-field-password" className="text-sm font-semibold text-foreground">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="auth-field-password"
              autoComplete="current-password"
              className="h-12 w-full border border-border bg-white px-4 pr-11 text-sm outline-none transition-colors focus:border-primary"
              name="password"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Nhập mật khẩu"
              type={isPasswordVisible ? "text" : "password"}
              value={values.password}
            />
            <button
              aria-label={isPasswordVisible ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsPasswordVisible((current) => !current)}
              type="button"
            >
              {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          size="lg"
          className="h-12 px-6 text-sm font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý" : "Đăng nhập"}
        </Button>
        <Link href="/dang-ky" className="text-sm font-semibold text-primary hover:underline">
          Chưa có tài khoản? Đăng ký ngay
        </Link>
      </div>
    </form>
  );
}
