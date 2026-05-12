# Design System

## Visual Theme
Industrial, Precise, Geometric, and Minimalist. A "Solid State" design language that prioritizes clarity, technical accuracy, and the complete removal of unnecessary decorative elements.

## Color Palette (OKLCH)
- **Primary (Trust Blue):** `oklch(0.42 0.16 250)` — Used for main navigation, primary actions, and brand identity.
- **Accent (Alert Red):** `oklch(0.55 0.22 25)` — Used for critical errors, deletions, and high-emphasis highlights.
- **Highlight (Warning Yellow):** `oklch(0.78 0.18 80)` — Used for warnings, technical highlights, and secondary brand presence.
- **Success (Industrial Green):** `oklch(0.58 0.18 145)` — Used for safe states, availability, and confirmed actions.
- **Background:** `oklch(1.0 0 0)` — Clean white for maximum readability.
- **Foreground:** `oklch(0.12 0.01 250)` — Deep charcoal for high contrast.

## Typography
- **Primary Font:** Inter (Hỗ trợ tiếng Việt hoàn chỉnh, cấu trúc hình học rõ ràng, tối ưu cho giao diện web và đọc lướt).
- **Secondary Font:** Roboto Mono (Phông chữ monospace tiêu chuẩn, dễ đọc, hỗ trợ tiếng Việt tốt để hiển thị Part Numbers, SKU, mã kỹ thuật).
- **Scale:** 1.25 ratio (Major Third) for strong hierarchical contrast.

## Layout & Geometry
- **Grid:** 8px base unit. 24px industrial grid for background alignment.
- **Radii:** `0px` strictly. Sharp corners convey industrial reliability.
- **Borders:** `1px` solid, using `--border` color. No heavy shadows or soft glows.
- **Containers:** Geometric blocks with defined borders. Avoid floating "cards" with soft shadows.

## Motion (GSAP)
- **Energy:** High, snappy, purposeful.
- **Easing:** `expo.out` for entry, `power2.out` for general transitions.
- **Logic:** Motion should imply mechanical precision, not organic fluidity.

## Components
- **Interactive Elements:** Mọi button, link, thẻ (card) hoặc icon có thể click đều bắt buộc phải có trạng thái `:hover` rõ ràng và trỏ chuột phải đổi thành `cursor: pointer`.
- **Buttons:** Solid blocks of primary/secondary colors. Sharp edges.
- **Inputs:** High-contrast borders. Monospaced text for technical entries.
- **Status Badges:** Solid background colors (Red/Yellow/Green) with high-contrast text. No gradients.
