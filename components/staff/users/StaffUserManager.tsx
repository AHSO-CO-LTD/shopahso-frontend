"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import { Button } from "@/components/ui/button";
import {
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUserStatus,
} from "@/lib/api/services/admin-users.service";
import type { AdminUser } from "@/lib/admin-user/types";

const USER_ROLE = "USER";

export default function StaffUserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [statusDraftByUser, setStatusDraftByUser] = useState<Record<string, boolean>>({});
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const selectedUser = useMemo(() => {
    if (users.length === 0) {
      return null;
    }

    if (!selectedUserId) {
      return users[0];
    }

    return users.find((user) => user.id === selectedUserId) ?? users[0];
  }, [selectedUserId, users]);

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const allUsers = await listAdminUsers();
        const customerUsers = allUsers.filter((user) => user.role === USER_ROLE);
        setUsers(customerUsers);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách người dùng.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadUsers();
  }, []);

  const syncUser = (nextUser: AdminUser) => {
    if (nextUser.role !== USER_ROLE) {
      setUsers((current) => current.filter((user) => user.id !== nextUser.id));
      return;
    }

    setUsers((current) => current.map((user) => (user.id === nextUser.id ? nextUser : user)));
  };

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUserId(user.id);
  };

  const handleStatusUpdate = async () => {
    if (!selectedUser) {
      toast.warning("Vui lòng chọn người dùng cần cập nhật.");
      return;
    }

    if (selectedUser.role !== USER_ROLE) {
      toast.error("Chỉ được quản lý tài khoản role USER.");
      return;
    }

    const statusDraft = statusDraftByUser[selectedUser.id] ?? selectedUser.active;

    const loadingId = toast.loading("Đang cập nhật trạng thái...");
    try {
      const updatedUser = await updateAdminUserStatus(selectedUser.id, { active: statusDraft });
      syncUser(updatedUser);
      toast.success("Đã cập nhật trạng thái người dùng.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.", { id: loadingId });
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUser) {
      toast.warning("Vui lòng chọn người dùng cần đặt lại mật khẩu.");
      return;
    }

    if (selectedUser.role !== USER_ROLE) {
      toast.error("Chỉ được quản lý tài khoản role USER.");
      return;
    }

    const loadingId = toast.loading("Đang đặt lại mật khẩu...");
    try {
      const updatedUser = await resetAdminUserPassword(selectedUser.id, {
        password: resetPasswordValue,
      });
      syncUser(updatedUser);
      setResetPasswordValue("");
      toast.success("Đã đặt lại mật khẩu người dùng.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đặt lại mật khẩu.", { id: loadingId });
    }
  };

  return (
    <StaffLayout>
      <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <section className="border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Người dùng</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Danh sách tài khoản USER</h2>
            </header>

            {isLoading ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>
            ) : errorMessage ? (
              <div className="px-6 py-10 text-sm text-destructive">{errorMessage}</div>
            ) : users.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">Không có tài khoản USER nào để quản lý.</div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <button
                    key={user.id}
                    className={[
                      "grid w-full gap-3 px-6 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_120px_110px]",
                      selectedUserId === user.id ? "bg-muted/25" : "hover:bg-muted/15",
                    ].join(" ")}
                    onClick={() => handleSelectUser(user)}
                    type="button"
                  >
                    <div>
                      <p className="font-semibold">{user.fullName || user.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-sm font-semibold">{user.role}</div>
                    <div className="text-sm font-semibold">{user.active ? "Hoạt động" : "Tạm khóa"}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="border border-border bg-background">
            <header className="border-b border-border px-6 py-5">
              <h3 className="text-xl font-black tracking-tight">Chi tiết người dùng</h3>
            </header>

            {!selectedUser ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">Chọn một tài khoản USER để quản lý.</div>
            ) : (
              <div className="space-y-6 px-6 py-6">
                <div className="space-y-2">
                  <p className="text-lg font-black tracking-tight">{selectedUser.fullName || "Chưa có họ tên"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Đăng nhập gần nhất:{" "}
                    {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString("vi-VN") : "Chưa có"}
                  </p>
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Trạng thái</span>
                    <select
                      className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                      onChange={(event) =>
                        setStatusDraftByUser((current) => ({
                          ...current,
                          [selectedUser.id]: event.target.value === "true",
                        }))
                      }
                      value={String(statusDraftByUser[selectedUser.id] ?? selectedUser.active)}
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Tạm khóa</option>
                    </select>
                  </label>
                  <Button className="h-11 w-full text-sm font-semibold" onClick={handleStatusUpdate} type="button" variant="outline">
                    Cập nhật trạng thái
                  </Button>
                </div>

                <form className="space-y-4 border-t border-border pt-6" onSubmit={handleResetPassword}>
                  <label className="grid gap-2 text-sm">
                    <span className="font-semibold">Mật khẩu mới</span>
                    <input
                      className="h-11 border border-border px-3 outline-none focus:border-primary"
                      onChange={(event) => setResetPasswordValue(event.target.value)}
                      required
                      type="password"
                      value={resetPasswordValue}
                    />
                  </label>
                  <Button className="h-11 w-full text-sm font-semibold" type="submit">
                    Đặt lại mật khẩu
                  </Button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </div>
    </StaffLayout>
  );
}
