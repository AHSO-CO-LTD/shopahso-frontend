# Staff Progress Snapshot

Ngày cập nhật: 2026-05-12
Phạm vi: Khu vực staff/admin frontend (`/nhan-vien/...`)

## 1) Đã hoàn thành

### 1.1 Danh mục (`/nhan-vien/danh-muc`)
- CRUD danh mục (tạo/sửa/ẩn mềm).
- Form dùng chung cho tạo/sửa.
- Search danh mục theo API `GET /backoffice/categories?q=...`.
- Tự động tạo slug qua `POST /slug`, vẫn cho phép chỉnh tay.
- Bỏ nhập tay `sortOrder`, FE cố định `sortOrder: 0`.
- UI có loading/error/empty state + toast Sonner.

### 1.2 Thương hiệu (`/nhan-vien/thuong-hieu`)
- CRUD thương hiệu (tạo/sửa/ẩn mềm).
- Form dùng chung cho tạo/sửa.
- Search nhanh theo `name/slug` (client-side).
- Validate `logoUrl` (http/https) trước submit.
- Tự động tạo slug qua `POST /slug`.
- Thông báo xóa mềm đúng ngữ nghĩa: “Đã ẩn thương hiệu”.

### 1.3 Sản phẩm & biến thể (staff/admin)
- Tách luồng theo yêu cầu mới:
  - `/nhan-vien/san-pham`: chỉ danh sách sản phẩm.
  - `/nhan-vien/san-pham/tao`: trang tạo sản phẩm riêng.
  - `/nhan-vien/san-pham/[id]`: trang quản lý chi tiết sản phẩm.
  - `/nhan-vien/san-pham/[id]/bien-the`: trang quản lý biến thể theo sản phẩm.
  - `/nhan-vien/san-pham/[id]/bien-the/tao`: trang tạo biến thể.
  - `/nhan-vien/san-pham/[id]/bien-the/[variantId]/sua`: trang sửa biến thể.
- Trong trang chi tiết sản phẩm:
  - Không còn form tạo/sửa biến thể tại chỗ.
  - Có nút chuyển sang trang quản lý biến thể riêng.
- Trang quản lý biến thể:
  - Có nút sửa từng biến thể.
  - Có nút ẩn mềm từng biến thể.
  - Hiển thị nhiều thông tin biến thể (SKU, slug, MPN, giá, tồn kho, MOQ, score, viewCount, orderCount...).
- Trang tạo biến thể:
  - Có danh sách biến thể hiện có + tổng số lượng để tránh tạo trùng.

### 1.4 Auth / token
- Đã xử lý race condition refresh token:
  - Dùng cơ chế single-flight refresh trong `authenticated-request`.
  - Tránh lỗi nhiều request 401 cùng lúc làm refresh token cũ bị invalid do rotate.

### 1.5 Login UX
- Đã thêm nút eye (hiện/ẩn mật khẩu) ở form đăng nhập.

## 2) Logic đang áp dụng (quan trọng)

- Tất cả thao tác user-facing đều báo Sonner toast.
- Soft delete:
  - Category/Brand/Product/Variant: cập nhật `active=false`.
- Slug:
  - Ưu tiên auto-generate bằng `POST /slug`.
  - Có thể chỉnh tay.
- Variant `score`:
  - Không cho nhập/chỉnh tay trên UI.
  - FE gửi `score: 0` theo giá trị hệ thống.
- Spec snapshot của variant:
  - Nhập JSON hợp lệ trong form.

## 3) Trạng thái dừng hiện tại

Đang dừng tại mốc:
- Staff pages cho `Danh mục`, `Thương hiệu`, `Sản phẩm`, `Biến thể` đã dựng và nối route.
- Luồng sản phẩm đã tách đúng kiến trúc “list -> detail -> variants pages”.
- Chưa triển khai thêm phần nâng cao như:
  - batch action,
  - upload ảnh/logo/file,
  - pagination lớn,
  - chuẩn hóa form thông số kiểu key-value thay vì JSON thô.

## 4) Gợi ý bước tiếp theo (chưa thực hiện)

1. Chuẩn hóa `specSnapshot` thành UI key-value (không nhập JSON tay).
2. Bổ sung pagination + server search cho danh sách sản phẩm/biến thể.
3. Thêm filter trạng thái (`Hoạt động/Tạm ẩn`) cho tất cả list.
4. Rà soát quyền theo role nếu cần tách hành vi STAFF và ADMIN chi tiết hơn.
