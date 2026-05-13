# Agent Instructions (AGENT.md)

Chào bạn (Agent), đây là các quy tắc và hướng dẫn quan trọng khi làm việc trong dự án ShopAHSO (Frontend). Vui lòng tuân thủ nghiêm ngặt các điều khoản sau:

## 🛠 Nguyên tắc cốt lõi
1. **Ưu tiên tiếng Việt**: Luôn phản hồi và giải thích bằng tiếng Việt trừ khi có yêu cầu khác.
2. **Không làm việc trên Main/Master**: Luôn thông báo cho người dùng nếu bạn đang ở nhánh `main` hoặc `master`.
3. **Hiểu rõ yêu cầu**: Luôn xác nhận yêu cầu trước khi bắt đầu. Đừng giả định các chi tiết còn thiếu.
4. **Chia nhỏ Code**: Tránh viết code nguyên khối. Phải luôn chia nhỏ các Component lớn thành các thành phần nhỏ gọn, có tính tái sử dụng cao. Tách biệt Layout (header, navbar, footer, body).

## 🎨 Frontend & UI
- **Framework**: Dự án sử dụng **Next.js**. Ưu tiên kiến trúc và thư mục chuẩn của Next.js (App Router).
- **Design System**: Tuân thủ hệ thống thiết kế hiện có (với các nguyên tắc công nghiệp, hạn chế dùng border-radius và gradient, không dùng shadow bừa bãi).
- **Animations**: Ưu tiên sử dụng **GSAP** cho các hiệu ứng chuyển động, đảm bảo mượt mà và không block luồng chính.
- **Components**: Bắt buộc sử dụng **shadcn/ui** (kết hợp Tailwind CSS) cho các thành phần giao diện trừ khi có chỉ định khác. Tránh code CSS/Tailwind thủ công nếu shadcn/ui đã hỗ trợ.
- **Tương tác (Interaction)**: Mọi phần tử có thể tương tác/click (button, link, icon...) BẮT BUỘC phải có hiệu ứng hover (thay đổi màu sắc, độ sáng, hoặc GSAP animation) và phải thay đổi con trỏ chuột (`cursor: pointer`) để người dùng dễ dàng nhận biết.
- **Thông báo**: Tuyệt đối không dùng `alert()`, `confirm()`, `prompt()` mặc định của trình duyệt. Luôn sử dụng **Sonner** để hiển thị thông báo (Success, Error, Warning, Loading).
- **Phản hồi người dùng**: Mọi hành động của người dùng đều phải có phản hồi rõ ràng qua UI. Không được fail silently.

## ⚙️ Tương tác API & Quản lý trạng thái
- **Trạng thái UI**: Luôn xử lý đầy đủ các trạng thái: Loading, Error, Empty trong mọi giao diện.
- **Hiệu năng**: Tránh re-render không cần thiết. Khuyến khích lazy loading với các thành phần nặng.
- **Cấu hình tập trung**: Các biến môi trường, base URL của API phải được định nghĩa trong `.env` và dùng thông qua một API client tập trung, tuyệt đối không hardcode URL rải rác trong các file Component hay Hook.

## 🚀 Quy trình thực thi
- Luôn chạy thử, kiểm tra và fix lỗi trước khi bàn giao. Đảm bảo giao diện không gặp lỗi (kể cả lỗi trong console).
- Sau khi hoàn thành, hãy cung cấp gợi ý cải thiện UI/UX nhưng **không tự ý thực hiện** khi chưa được duyệt.
- Chú ý đến Accessibility (a11y) cơ bản: độ tương phản, HTML semantic, và khả năng sử dụng bàn phím.

## 📚 Kỹ năng đặc biệt
- Dự án có tích hợp skill **impeccable** tại `.agents/skills/impeccable`. Hãy sử dụng nó khi cần thiết kế, audit UI, hoặc cải thiện mức độ hoàn thiện của giao diện.
- Có thể dùng các skill như **craft**, **audit**, **polish** theo ngữ cảnh tương ứng.

---
**Ghi chú**: Mọi lỗi phát sinh phải được hiển thị rõ ràng cho người dùng, không được để lỗi chạy ngầm (fail silently). Lỗi phải được handle cẩn thận.
