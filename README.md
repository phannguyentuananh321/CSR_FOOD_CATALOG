# Ấm Vị — Food Editorial

## 1. Giới thiệu

Ấm Vị là website giới thiệu ẩm thực Việt theo phong cách tạp chí, gồm hai khu vực:

- **Công khai:** danh sách và chi tiết món ăn, đầu bếp, nguyên liệu; tìm kiếm, lọc, sắp xếp, phân trang; carousel món nổi bật ở trang chủ.
- **Quản trị:** thêm, sửa, xóa ba loại dữ liệu; gán quan hệ nhiều-nhiều giữa món ăn với đầu bếp/nguyên liệu; quản lý ảnh, validation và thông báo sau thao tác.
- Khu quản trị hiện **không có đăng nhập**, đúng với phạm vi được ghi trong `FUNCTIONAL_SPEC.md`.

## 2. Technical Stack

| Thành phần | Công nghệ đang dùng |
| :--- | :--- |
| **Frontend** | React 19.1 + TypeScript 5.9; build bằng Vite 6.3; routing bằng React Router DOM 7.6; giao diện Tailwind CSS 4.1 qua `@tailwindcss/vite`. Không dùng UI component library riêng. |
| **Hiệu ứng hero** | Vanta.js 0.5 (`vanta.birds`) + Three.js 0.125, tải động ở trang danh sách món ăn; có fallback nền tĩnh và tôn trọng `prefers-reduced-motion`. |
| **Backend** | Node.js (ES Modules), Express 4.21; `cors`, `dotenv`, `multer` (upload ảnh), `@supabase/supabase-js`. |
| **Database / ORM** | PostgreSQL (Supabase) + Prisma 6.16 (`@prisma/client`, Prisma CLI). |
| **Lưu trữ ảnh** | Supabase Storage nếu cấu hình `SUPABASE_*`; nếu không, lưu cục bộ trong `api/uploads` và phục vụ qua `/uploads`. |
| **Kiểm thử / công cụ** | npm (có `package-lock.json` ở `api` và `web`), `tsc`, `vite build`, script kiểm thử API `api/scripts/test-api.mjs`. |

Cấu trúc chính:

```text
api/                 Express API, Prisma schema/migrations/seed, script test API
web/                 React SPA (src/pages/public, src/pages/admin, src/components)
FUNCTIONAL_SPEC.md   Đặc tả chức năng dùng để đối chiếu
```

## 3. Cài đặt và chạy

### 3.1. Điều kiện cần có

- Node.js và npm (khuyến nghị Node.js 18 trở lên).
- Git, hoặc trình duyệt để tải ZIP từ GitHub.
- Một database PostgreSQL/Supabase đang hoạt động.
- Tài khoản Supabase Storage là **tùy chọn**; nếu không cấu hình, API dùng thư mục `api/uploads`.

### 3.2. Lấy project

```bash
git clone <URL_REPO>
cd BLOCK6
```

Hoặc tải ZIP từ GitHub, giải nén và mở thư mục project.

### 3.3. Chạy API — Terminal 1

```bash
cd api
npm ci
copy .env.example .env
```

> macOS/Linux dùng `cp .env.example .env`.

Mở `api/.env` và điền:

```env
DATABASE_URL=...        # bắt buộc
DIRECT_URL=...          # bắt buộc
PORT=3000
APP_BASE_URL=http://localhost:3000
WEB_ORIGIN=http://localhost:5173

# Tùy chọn — chỉ cần nếu dùng Supabase Storage
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=dish-images
```

Không commit `.env`. Sau đó chạy:

```bash
npm run prisma:generate
npm run prisma:migrate
# npm run db:seed        # tùy chọn, chỉ thêm dữ liệu mẫu khi DB trống
npm run dev
```

API chạy tại `http://localhost:3000`.

> `prisma:migrate` có thể thay đổi cấu trúc database; kiểm tra đúng database trước khi chạy.

### 3.4. Chạy web — Terminal 2

```bash
cd web
npm ci
copy .env.example .env
```

> macOS/Linux dùng `cp .env.example .env`.

Trong `web/.env`, ghi:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Sau đó chạy:

```bash
npm run dev
```

Web chạy tại `http://localhost:5173` và tự chuyển `/` về `/dishes`.

### 3.5. Kiểm tra sau khi chạy

- Website: `http://localhost:5173/dishes`
- Kiểm tra API: `http://localhost:3000/api/health`
- Kiểm tra API đọc được database: `http://localhost:3000/api/dishes?limit=1`
- Kiểm tra nhanh giao diện quản trị: `http://localhost:5173/admin/dishes`

Kiểm tra build frontend:

```bash
cd web
npm run build
```

Chạy bộ kiểm thử API (khi API đang chạy):

```bash
cd api
npm run test:api
```

> Script kiểm thử tạo một số bản ghi tạm và dọn chúng khi kết thúc. Không chạy trên database thật nếu không muốn có bản ghi thử tạm thời.

### 3.6. Một số lỗi thường gặp

| Hiện tượng | Cách xử lý |
| :--- | :--- |
| `EADDRINUSE` | Cổng `3000` hoặc `5173` đang bị chiếm. Tắt tiến trình cũ hoặc đổi `PORT`/cấu hình Vite. |
| API trả `500` khi gọi danh sách | Kiểm tra `DATABASE_URL`, `DIRECT_URL`, kết nối mạng tới database và log terminal API. |
| Lỗi CORS trên trình duyệt | Đặt `WEB_ORIGIN` đúng origin của web, ví dụ `http://localhost:5173`; không dùng `*`. |
| Web báo thiếu API base URL | Kiểm tra `web/.env` có `VITE_API_BASE_URL` và khởi động lại `npm run dev`. |
| Ảnh không hiển thị | Kiểm tra `APP_BASE_URL`/`SUPABASE_*`; với ảnh cục bộ, kiểm tra thư mục `api/uploads` và route `/uploads`. |
| Mở trực tiếp URL trên hosting tĩnh bị `404` | Cấu hình rewrite mọi đường dẫn SPA về `index.html` (dev server Vite đã hỗ trợ sẵn). |

## 4. Đối chiếu đề bài

### 4.1. Bằng chứng đã kiểm tra

- API đang chạy, `/api/health` trả `ok: true`; đọc được dữ liệu thật từ database.
- `npm run build` và `npm run typecheck` trong `web` đều chạy thành công.
- Bộ kiểm thử API hiện có 49 kiểm tra; lần chạy gần nhất đạt **49 PASS / 0 FAIL**.
- Đã mở trực tiếp các URL SPA chính và kiểm tra CORS thủ công: origin được cấu hình nhận header, origin lạ không nhận header, preflight trả `204`.
- Đã thử endpoint khi database không kết nối: API trả HTTP `500` với JSON `INTERNAL_ERROR`.

### 4.2. Bảng đối chiếu

| Yêu cầu | Trạng thái | Ghi chú / Bằng chứng |
| :--- | :---: | :--- |
| **REST API — CRUD món ăn** | `PASS` | Đủ GET danh sách/chi tiết, POST, PATCH, DELETE trong `api/src/routes/dishes.js`; test API đạt. |
| **REST API — CRUD đầu bếp** | `PASS` | Đủ 5 thao tác trong `api/src/routes/chefs.js`; xóa bị chặn khi còn món liên kết, test đạt. |
| **REST API — CRUD nguyên liệu** | `PASS` | Đủ 5 thao tác trong `api/src/routes/ingredients.js`; xóa bị chặn khi đang được dùng, test đạt. |
| **Response thành công** | `PASS` | Dạng `{ ok: true, data }`, danh sách có thêm `meta`; test kiểm tra status `200`. |
| **Lỗi nghiệp vụ** | `PASS` | Lỗi trả HTTP `200`, `ok: false`, `error.code`; có `NOT_FOUND`, `VALIDATION_FAILED`, `RELATION_NOT_FOUND`, `IN_USE` (`api/src/utils/errors.js`, `middleware/http.js`). |
| **Danh sách rỗng, URL sai, lỗi hệ thống** | `PASS` | Danh sách rỗng trả `data: []`; URL API sai trả `404`; đã thử database lỗi và nhận `500` JSON. |
| **GET không ghi dữ liệu** | `PASS` | Các handler GET chỉ gọi truy vấn đọc; không có thao tác create/update/delete. |
| **Validate input** | `PARTIAL` | Có validate tên, giá, quan hệ và trả lỗi theo trường. Tuy nhiên `POST /api/dishes` thiếu `category` vẫn được mặc định thành `Món chính` thay vì báo lỗi như đặc tả (`api/src/utils/validate.js`). |
| **CORS** | `PASS` | Đọc từ `WEB_ORIGIN`, không dùng `*`; kiểm tra thủ công origin hợp lệ/không hợp lệ và preflight `204`. |
| **URL API tập trung, kiểm tra HTTP/`ok`** | `PASS` | Frontend gọi qua `web/src/api/client.ts`; kiểm tra `res.status !== 200`, `payload.ok` và lỗi mạng. |
| **Không lộ secret server ở frontend** | `PASS` | Frontend chỉ dùng `VITE_API_BASE_URL`; đã quét bundle `web/dist`, không thấy thông tin service role/database. Các file `.env` nằm trong `.gitignore`. |
| **SPA — URL danh sách/chi tiết** | `PASS` | `/dishes`, `/dishes/:id`, `/chefs`, `/chefs/:id`, `/ingredients`, `/ingredients/:id` trong `web/src/App.tsx`. |
| **SPA — URL quản trị món ăn** | `PASS` | `/admin/dishes`, `/new`, `/:id/edit`, `/:id/delete`; đã mở trực tiếp các route. |
| **SPA — quản trị đầu bếp/nguyên liệu** | `PASS` | Đủ danh sách, thêm, sửa, xóa cho cả hai tài nguyên; đã kiểm tra route và form. |
| **Tìm kiếm `q`** | `PASS` | Danh sách công khai và quản trị lấy `q` từ URL; API tìm theo tên, không phân biệt hoa/thường; test đạt. |
| **Form sửa lấy ID từ URL** | `PASS` | `useParams` + `useFetch` trong các trang form; route `/admin/.../:id/edit`. |
| **Loading, error, notFound, empty** | `PASS` | Có `LoadingBlock`, `ErrorPanel`, `NotFoundPanel`, `EmptyState`; đã quan sát loading và 404 khi mở route. |
| **Validation cạnh trường, giữ giá trị nhập** | `PASS` | Form dùng state có kiểm soát và `fieldErrors`; lỗi API được gắn vào từng trường, không reset form. |
| **Xóa chỉ sau xác nhận** | `PASS` | Trang `/admin/.../:id/delete` chỉ gửi DELETE khi bấm `Xác Nhận Xóa`; mở/refresh trang chỉ tải dữ liệu. Thiết kế dùng trang/overlay xác nhận thay cho modal trong danh sách. |
| **Điều hướng client-side sau thao tác ghi** | `PASS` | Thêm/sửa/xóa dùng `navigate(..., { state: ... })`; không submit form kiểu reload toàn trang. |
| **Mở trực tiếp/reload URL SPA** | `PASS` | Vite dev trả `200` và `index.html` cho các URL sâu; route render đúng. Khi triển khai hosting tĩnh cần cấu hình rewrite. |
| **Dữ liệu lấy từ API thật** | `PASS` | Danh sách/chi tiết và quản trị gọi API; đã thấy dữ liệu thật từ database. |
| **Điều hướng nội bộ hoàn toàn client-side** | `PARTIAL` | Luồng ghi chính dùng React Router. Một số link phụ (`EmptyState`, `NotFoundPanel`, link tạo nhanh trong form) đang dùng `<a href>` nên có thể reload document. |
| **Quan hệ món ăn–đầu bếp–nguyên liệu** | `PASS` | Schema nhiều-nhiều, gán/khử trùng, kiểm tra ID tồn tại; test quan hệ đạt. |
| **Tìm kiếm, lọc, sắp xếp, phân trang** | `PASS` | API hỗ trợ `q`, `category`, `minPrice`, `maxPrice`, 5 kiểu sort; public 9 mục/trang, quản trị 10; `Pagination` giữ bộ lọc. |
| **Món nổi bật / carousel** | `PASS` | `FeaturedCarousel` lấy món featured, hiển thị tối đa 4 món; đã quan sát khối “Món Nổi Bật Được Yêu Thích”. |
| **Quản lý ảnh** | `PASS` | Giới hạn JPG/JPEG/PNG/WEBP, 5 MB; preview 4:3; giữ ảnh cũ nếu không chọn mới; dọn ảnh mới khi lưu lỗi; có test upload. |
| **Thông báo và trạng thái lỗi** | `PASS` | Alert đóng được; thông báo thành công/lỗi sau thao tác; trang 404/500 không lộ stack trace. |
| **Giao diện công khai/quản trị** | `PASS` | Đã kiểm tra các trang danh sách, chi tiết, form và bảng quản trị; giao diện tách khỏi khu admin. |
| **Hiệu ứng hero** | `PASS` | Vanta chỉ dùng ở trang công khai, có fallback gradient, tôn trọng `prefers-reduced-motion`; resize theo kích thước hero. |
| **Kiểm thử tự động toàn bộ frontend** | `NOT VERIFIED` | Project chưa có test E2E/unit cho frontend; mới kiểm tra thủ công một số route và hành vi. |
| **Triển khai production/SPA fallback** | `NOT VERIFIED` | Chưa có cấu hình hosting/deploy trong repo; cần rewrite về `index.html` nếu deploy tĩnh. |

### 4.3. Tóm tắt

- **Đáp ứng tốt:** REST API CRUD cho cả ba tài nguyên, contract response/error, CORS, các route SPA bắt buộc, tìm kiếm/lọc/phân trang, quan hệ dữ liệu, quản lý ảnh và giao diện quản trị.
- **Cần bổ sung/lưu ý:**
  1. API nên từ chối `POST /api/dishes` thiếu `category` thay vì tự gán `Món chính` để khớp đặc tả validate.
  2. Một số link phụ dùng `<a href>` gây reload document; nên chuyển sang `Link` của React Router nếu yêu cầu client-side tuyệt đối.
  3. Chưa có test tự động frontend và cấu hình SPA fallback cho môi trường production.
  4. Khu quản trị không có đăng nhập theo đúng phạm vi hiện tại của `FUNCTIONAL_SPEC.md`; nếu triển khai công khai cần bổ sung xác thực.
