# 📚 CẤU TRÚC TOÀN DIỆN MÃ NGUỒN COURSELIT (README_2.MD)

Tài liệu này giải thích chi tiết toàn bộ kiến trúc mã nguồn, các module, thư mục, cơ sở dữ liệu và luồng hoạt động của dự án **CourseLit**.

---

## 1. 🌟 Tổng Quan Dự Án & Công Nghệ

**CourseLit** là nền tảng quản trị học tập (LMS) và thương mại điện tử khóa học đa người dùng (**Multi-tenant SaaS**), cho phép các nhà sáng tạo nội dung tự mở trường học trực tuyến, bán khóa học, bài viết blog, và quản lý học viên trên tên miền riêng của họ.

### 🛠️ Tech Stack Chính:

- **Ngôn ngữ:** TypeScript (100% Type-safe)
- **Kiến trúc Monorepo:** Quản lý bằng `pnpm workspaces`
- **Frontend & Backend chính:** Next.js (App Router, Turbopack, Server Actions, React 19)
- **Cơ sở dữ liệu:** MongoDB (với Mongoose ODM)
- **API:** GraphQL API + REST API (tự động xuất tài liệu chuẩn OpenAPI / Swagger)
- **Xác thực (Auth):** Better-Auth & Session-based Auth (hỗ trợ SSO, Google Sign-in, Magic Link / OTP)
- **Xử lý nền (Background Worker):** Module Queue riêng biệt (`apps/queue`)
- **Giao diện (UI/UX):** Tailwind CSS + Radix UI (shadcn style), Lucide Icons, Tiptap Rich-text Editor

---

## 2. 🏛️ Sơ Đồ Cấu Trúc Thư Mục Monorepo

Dự án được phân chia thành 2 thư mục cốt lõi:

1. `apps/`: Chứa các ứng dụng độc lập có thể chạy trực tiếp.
2. `packages/`: Chứa các thư viện/module dùng chung (shared logic, UI, database models).

```text
courselit/
├── apps/                                 # CÁC ỨNG DỤNG ĐỘC LẬP
│   ├── web/                              # Ứng dụng Next.js chính (Frontend + Backend + API)
│   ├── queue/                            # Background job worker (xử lý tác vụ nền)
│   └── docs/                             # Trang tài liệu hướng dẫn người dùng
│
├── packages/                             # CÁC THƯ VIỆN & MODULE DÙNG CHUNG
│   ├── common-models/                    # Khai báo TypeScript types, interfaces, constants
│   ├── orm-models/                       # Mongoose schemas & Database models kết nối MongoDB
│   ├── common-logic/                     # Logic nghiệp vụ chung (xác thực, tính toán, quyền hạn)
│   ├── components-library/               # Các UI components tái sử dụng (form, upload, modal...)
│   ├── page-blocks/                      # Các khối giao diện kéo thả (Hero, Courses, Header...)
│   ├── page-primitives/                  # Giao diện nguyên tử & Các bộ Theme (Classic, Modern...)
│   ├── page-models/                      # Định nghĩa cấu trúc Page, Block, Theme layout
│   ├── text-editor/                      # Trình soạn thảo văn bản Tiptap cho bài học/trang
│   ├── email-editor/                     # Trình soạn thảo và render template email
│   ├── utils/                            # Tiện ích chung (hashing, jwt, date format...)
│   ├── icons/                            # Bộ icon SVG / Lucide chuẩn hóa
│   ├── scripts/                          # Script bảo trì hệ thống và vận hành dữ liệu
│   ├── tailwind-config/                  # Cấu hình Tailwind CSS dùng chung
│   └── tsconfig/                         # Cấu hình TypeScript dùng chung
│
├── pnpm-workspace.yaml                   # Khai báo cấu hình workspace pnpm
└── package.json                          # Script root điều phối toàn bộ monorepo
```

---

## 3. 🚀 Chi Tiết Ứng Dụng Chính: `apps/web`

Đây là trái tim của hệ thống, xử lý cả giao diện người dùng (LMS, Dashboard, Storefront) và máy chủ backend (Next.js Server Actions, GraphQL, REST API).

### 📁 Cấu trúc bên trong `apps/web/`:

```text
apps/web/
├── app/                                  # Next.js App Router
│   ├── (with-contexts)/                  # Các trang có chia sẻ App Context & State
│   │   ├── (sidebar)/                    # Các trang có Sidebar bên trái
│   │   │   └── dashboard/                # Trang BẢNG ĐIỀU KHIỂN DÀNH CHO ADMIN
│   │   │       ├── courses/              # Quản lý khóa học, bài học, chương học
│   │   │       ├── users/                # Quản lý học viên, phân quyền, nhóm
│   │   │       ├── pages/                # Quản lý trang (Homepage, Custom pages)
│   │   │       ├── settings/             # Cài đặt trường (Domain, Thanh toán, Mail, SSO)
│   │   │       ├── sales/                # Báo cáo doanh thu, đơn hàng
│   │   │       └── media/                # Quản lý thư viện hình ảnh/video/tài liệu
│   │   ├── (with-layout)/                # Các trang công khai cho khách hàng/học viên
│   │   │   ├── page.tsx                  # Trang chủ (Homepage của trường)
│   │   │   ├── p/[id]/page.tsx           # Trang chi tiết giới thiệu/bán khóa học
│   │   │   └── blog/                     # Trang danh sách và chi tiết bài viết Blog
│   │   └── course/[slug]/[id]/           # COURSE VIEWER (Giao diện học tập, xem video, làm quiz)
│   ├── api/                              # REST API Endpoints
│   │   ├── users/                        # REST API tạo/cập nhật người dùng
│   │   ├── products/                     # REST API quản lý khóa học/sản phẩm
│   │   └── ...                           # Webhook xử lý Stripe, Razorpay, SSO
│   ├── login/                            # Trang đăng nhập học viên / admin
│   └── layout.tsx                        # Root layout toàn trang
│
├── graphql/                              # GRAPHQL SERVER & RESOLVERS
│   ├── schema.ts                         # Định nghĩa schema GraphQL chung
│   ├── users/                            # Queries/Mutations cho User
│   ├── courses/                          # Queries/Mutations cho Khóa học & Bài học
│   ├── pages/                            # Queries/Mutations cho Page Builder
│   └── settings/                         # Queries/Mutations cho Cài đặt
│
├── models/                               # Mongoose Models được import từ @courselit/orm-models
├── lib/                                  # Helper riêng cho web (cache, database connection, mail)
├── openapi/                              # Cấu hình & Trình tạo Swagger Documentation tự động
├── auth.ts                               # Cấu hình Better-Auth & xác thực session
└── proxy.ts                              # Middleware phân giải Multi-tenant Domain
```

---

## 4. 📦 Chi Tiết Các Shared Packages (`packages/`)

| Package                  | Tên Workspace                   | Chức Năng & Trách Nhiệm                                                                                                                                              |
| :----------------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`common-models`**      | `@courselit/common-models`      | Chứa tất cả Typescript Interface & Type chung (`User`, `Course`, `Lesson`, `Domain`, `Payment`, `PageBlock`...). Đảm bảo toàn bộ project dùng chung 1 chuẩn dữ liệu. |
| **`orm-models`**         | `@courselit/orm-models`         | Chứa các Schema của Mongoose kết nối trực tiếp vào MongoDB.                                                                                                          |
| **`common-logic`**       | `@courselit/common-logic`       | Logic nghiệp vụ cốt lõi: Kiểm tra quyền hạn (RBAC), tính toán giá tiền, chiết khấu, xử lý tiến độ học tập.                                                           |
| **`components-library`** | `@courselit/components-library` | Các thành phần UI cấp cao: Media Selector, Form Upload, Modal xác nhận, Dropdown chọn bài học.                                                                       |
| **`page-blocks`**        | `@courselit/page-blocks`        | Các block giao diện của Page Builder: Khối Hero Banner, Khối danh sách khóa học (Course Grid), Khối đánh giá (Testimonials), Khối Footer, Header.                    |
| **`page-primitives`**    | `@courselit/page-primitives`    | Các UI đơn giản (Button, Input, Badge, Card) và định nghĩa 5 bộ theme màu sắc (`Classic`, `Editorial`, `Learning`, `Midnight`, `Neobrutalism`).                      |
| **`text-editor`**        | `@courselit/text-editor`        | Trình soạn thảo văn bản nâng cao xây dựng trên nền **Tiptap Prosemirror** hỗ trợ nhúng code, công thức, video, định dạng văn bản cho bài giảng.                      |
| **`email-editor`**       | `@courselit/email-editor`       | Trình tạo và biên dịch template email gửi cho học viên (OTP, thông báo mua hàng, hoàn thành khóa học).                                                               |
| **`utils`**              | `@courselit/utils`              | Hàm tiện ích độc lập: tạo ID ngẫu nhiên, định dạng tiền tệ quốc tế, validate email, parse URL.                                                                       |

---

## 5. 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (MongoDB Collections)

Mỗi trường học hoặc người dùng trên hệ thống đều được lưu trữ theo cơ chế **Multi-tenant (đa tên miền)**:

1. **`domains`**: Lưu thông tin trường học/website (tên miền, cấu hình logo, tiêu đề, tiền tệ thanh toán, cấu hình email, màu sắc theme).
2. **`users`**: Lưu thông tin tài khoản người dùng, email, mật khẩu băm, quyền hạn (`superadmin`, `admin`, `creator`, `member`).
3. **`courses`**: Lưu thông tin khóa học/sản phẩm (tiêu đề, mô tả, giá tiền, ảnh bìa, trạng thái xuất bản `published`).
4. **`lessons`**: Lưu nội dung từng bài học (video URL, tài liệu PDF, bài tập trắc nghiệm Quiz, mã nhúng Embed, nội dung văn bản Tiptap).
5. **`pages`**: Lưu layout trang web (gồm mảng các `layout.blocks` được cấu hình qua trình kéo thả).
6. **`groups`**: Nhóm các chương (Sections) trong khóa học.
7. **`purchases` / `payments`**: Giao dịch mua khóa học và lịch sử thanh toán qua Stripe / Razorpay.
8. **`progresses`**: Tiến độ học tập của từng học viên (các bài học đã hoàn thành, điểm số làm quiz).

---

## 6. 🔄 Các Luồng Xử Lý Chính (Workflows)

### 1. Luồng Phân Giải Tên Miền (Multi-Tenancy Resolution)

- Khi một yêu cầu HTTP gửi đến, `proxy.ts` (Next.js Middleware) đọc `Host header` (ví dụ `localhost:3000` hoặc `school.mycustomdomain.com`).
- Hệ thống tìm bản ghi trong bảng `domains` khớp với domain đó và gắn `domainId` vào ngữ cảnh phiên làm việc (Async Local Storage).
- Mọi truy vấn database sau đó tự động lọc theo `domainId` của trường đó.

### 2. Luồng Học Tập (Course Player Flow)

- Học viên truy cập `/course/[slug]/[id]`.
- Hệ thống kiểm tra quyền: Nếu khóa học miễn phí hoặc học viên đã thanh toán (`purchases`), mở khóa toàn bộ bài học.
- Học viên xem bài giảng (Video / Tiptap text / PDF / Quiz) -> bấm "Mark Complete" -> Next.js Server Action ghi nhận vào bảng `progresses`.

### 3. Luồng Quản Lý Trang Kéo Thả (Page Builder)

- Admin vào `/dashboard/pages` -> chọn trang cần chỉnh sửa.
- Admin thêm/sửa/xóa các khối (blocks) như Hero, Rich-text, Course grid, v.v.
- Khi lưu, toàn bộ danh sách khối được lưu dưới dạng JSON trong trường `layout` của collection `pages`.
- Khi người dùng vào trang chủ, Next.js render động từng component từ `@courselit/page-blocks` dựa theo mảng JSON này.

---

## 7. 💻 Các Lệnh Thao Tác Thường Dùng (Commands Reference)

| Lệnh                               | Ý Nghĩa                                                      |
| :--------------------------------- | :----------------------------------------------------------- |
| `pnpm dev`                         | Khởi chạy máy chủ phát triển local (`http://localhost:3000`) |
| `pnpm build`                       | Build tất cả package và ứng dụng sang chế độ production      |
| `pnpm --filter @courselit/web dev` | Chỉ khởi chạy riêng ứng dụng Web                             |
| `pnpm test`                        | Chạy bộ kiểm thử tự động (Jest Unit & Integration tests)     |
| `pnpm lint`                        | Kiểm tra cú pháp và chất lượng mã nguồn (ESLint)             |
| `pnpm prettier`                    | Tự động căn chỉnh định dạng code chuẩn theo toàn dự án       |

---

_Tài liệu được tạo tự động nhằm hỗ trợ tra cứu toàn diện cấu trúc dự án CourseLit._
