# Nhà mình TV — Gói bàn giao cho Claude Code

Ngày đóng gói: **24/10/2026**.

Bản mẫu giao diện TV như album ảnh kỹ thuật số, theo hướng hiện đại lấy cảm hứng từ Apple TV: nền ảnh lớn, tông tối, thẻ kính mờ, đồng hồ và lịch âm Việt Nam, thanh nhạc YouTube, hàng ứng dụng mở nhanh.

Gói này chứa toàn bộ phần web của bản đã bàn giao, sáu ảnh minh họa, hướng dẫn tiếp tục phát triển và máy chủ chạy thử cục bộ. Có thể chỉnh sửa độc lập bằng Claude Code hoặc trình soạn thảo khác.

## 1. Chạy ngay trên máy

Cách chính: dùng Node.js 18 trở lên. Mở Terminal trong thư mục `nha-minh-tv` đã giải nén rồi chạy:

```bash
npm run dev
```

Mở **http://127.0.0.1:5173**. Không cần `npm install`, không có dependency npm và không có bước build. Sau khi sửa file, tải lại trang để xem thay đổi. Nhấn `Ctrl+C` trong Terminal để dừng.

Nếu cổng đang được dùng, trên macOS/Linux có thể chọn cổng khác:

```bash
NHA_MINH_PORT=5180 npm run dev
```

Nếu chưa có Node.js nhưng có Python 3, chạy thay thế từ thư mục dự án:

```bash
python3 -m http.server 5173 --bind 127.0.0.1 --directory dist
```

Không mở trực tiếp `dist/index.html` bằng `file://`: ứng dụng dùng JavaScript ES modules; hãy chạy qua HTTP như trên.

## 2. Mở trong Claude Code

Mở cả thư mục `nha-minh-tv`, không chỉ một file HTML. Tệp `CLAUDE.md` ghi lại bối cảnh, kiến trúc và những điểm cần giữ khi sửa.

Có thể bắt đầu bằng yêu cầu:

> Đọc README.md và CLAUDE.md, chạy dự án hiện tại và tiếp tục phát triển giao diện TV này. Giữ phong cách hiện đại giống Apple TV, album ảnh, đồng hồ, lịch âm Việt Nam và thanh nhạc YouTube. Trước tiên kiểm tra luồng phát nhạc thực tế, điều hướng bằng remote và bố cục màn hình TV 16:9. Làm tiếp từ mã nguồn hiện có.

## 3. Cấu trúc dự án

| Đường dẫn | Vai trò |
| --- | --- |
| `dist/index.html` | Cấu trúc giao diện, các nút, dialog và biểu tượng SVG |
| `dist/style.css` | Các quy tắc nền, bố cục, tương tác và một phần phong cách ban đầu |
| `dist/modern.css` | Lớp giao diện hiện đại hiện đang dùng; được nạp sau `style.css` |
| `dist/app.js` | Album, lưu ảnh, đồng hồ, lịch, hẹn giờ, điều hướng phím, YouTube |
| `dist/lunar.mjs` | Đổi lịch dương sang âm Việt Nam và lấy giờ UTC+7 |
| `dist/assets/` | Sáu ảnh minh họa và metadata nguồn ảnh |
| `scripts/serve.mjs` | Máy chủ chạy thử cục bộ, không dependency |
| `package.json` | Lệnh `dev`, `start`, `check` |
| `CLAUDE.md` | Hướng dẫn bàn giao cho trợ lý lập trình |
| `CREDITS.md` | Nguồn ảnh, lịch âm và tài liệu YouTube |

`dist/` ở dự án này cũng là mã nguồn web có thể sửa trực tiếp; không phải thư mục tự sinh từ một framework. Khi triển khai sang hosting tĩnh khác, dùng nội dung thư mục này làm web root.

## 4. Các chức năng hiện có

- Sáu ảnh mẫu, ba trang album, xem ảnh lớn, tự trượt trang mỗi 3 giây (đổi được 3/8/15/30 giây).
- Thêm ảnh của người dùng; tối đa 24 ảnh, mỗi tệp đầu vào tối đa 25 MB. Ảnh được thu nhỏ cạnh dài tối đa 1920 px, chuyển JPEG chất lượng 0.88 để lưu cục bộ.
- Đồng hồ và ngày hiện tại theo `Asia/Ho_Chi_Minh`.
- Lịch âm Việt Nam theo UTC+7; lịch tháng có ngày âm, tháng nhuận và can chi năm.
- Hẹn giờ 5, 15, 30 hoặc 60 phút trong khi trang còn mở.
- Nút toàn màn hình, điều hướng bằng phím mũi tên/Enter và đóng khung bằng Escape.
- Ba tông giao diện: **Điện ảnh**, **Xanh đêm**, **Tối giản**.
- Thanh nhạc YouTube: Top nhạc trẻ thịnh hành (playlist bảng xếp hạng Việt Nam do YouTube cập nhật hằng tuần), Chillhop Radio (Lofi Girl không cho phát nhúng, lỗi 150), nhập link video/playlist; phát/tạm dừng, chuyển video trong playlist, tua khi video có thời lượng.
- Các ô mở YouTube, Spotify và Netflix bằng trang web.

## 5. Dữ liệu cá nhân và việc chuyển máy

Ảnh đã thêm qua giao diện nằm trong **IndexedDB của trình duyệt**, database `nha-minh-album`, store `album`, key `photos`.

Thiết lập giao diện nằm trong `localStorage['nha-minh-preferences']`. Các giá trị theme nội bộ là `warm`, `sage`, `night`, tương ứng Điện ảnh, Xanh đêm, Tối giản.

**ZIP chứa mã nguồn và ảnh minh họa. Ảnh người dùng đã thêm trên trang đang mở không nằm trong ZIP.** Dữ liệu trình duyệt thuộc từng origin; khi đổi tên miền, địa chỉ hoặc cổng, ảnh/thiết lập không tự đồng bộ. Hiện chưa có tài khoản ứng dụng, backend, cloud sync hay chức năng xuất/nhập album riêng.

## 6. Trạng thái YouTube cần biết

Trình phát dùng YouTube IFrame API; script chỉ được tải khi người dùng bấm phát. Video được hiển thị trong giao diện, không dùng cách trích xuất audio hoặc ẩn video để nghe nền.

`topPlaylist` trong `dist/app.js` là một ID playlist cấu hình sẵn. **Ứng dụng chưa tích hợp API lấy bảng xếp hạng Top YouTube theo thời gian thực.** Danh sách và các video do YouTube cung cấp; cần kiểm tra lại nội dung trước khi dùng như một bảng xếp hạng hiện hành.

Ở phiên kiểm tra trước khi bàn giao, iframe đã nạp được video, tiêu đề và thời lượng nhưng vẫn ở trạng thái buffering. **Chưa xác nhận âm thanh phát ổn định.** Ưu tiên kiểm tra trên trình duyệt và mạng thực tế: nút Play do người dùng bấm, quyền phát nhúng của từng video/playlist, cookie hoặc chặn nội dung bên thứ ba, autoplay, đổi playlist trong khi tải và thông báo lỗi.

Nhạc, bảng xếp hạng và các ô dịch vụ ngoài cần Internet. Mã nguồn này không chứa tài khoản dịch vụ, API key hoặc cơ chế vượt qua yêu cầu đăng nhập của các nhà cung cấp.

## 7. Kiểm tra và giới hạn của bản mẫu

Chạy kiểm tra cú pháp:

```bash
npm run check
```

Mã nguồn giao diện được giữ theo commit tham chiếu `e7a2b5ac1b5aac7898e7895b1c62a6ccb0f06a73` của bản bàn giao. Gói này thêm tài liệu và máy chủ chạy cục bộ; không kèm lịch sử Git hay cấu hình đăng nhập triển khai của môi trường cũ.

Đã quan sát giao diện, ảnh và lịch hoạt động trên trình duyệt desktop; lần kiểm tra cuối không có tràn ngang/dọc ở viewport 1363×936. Chưa kiểm tra thiết bị TV, remote phần cứng hoặc phát nhạc ổn định. Cần kiểm tra lại sau các chỉnh sửa.

Các mốc lịch âm đã kiểm tra: 24/10/2026 → 15/9 Bính Ngọ; 06/02/2027 → 1/1 Đinh Mùi; 25/07/2025 → 1/6 nhuận Ất Tỵ; chuyển ngày Việt Nam lúc 17:00 UTC. Thuật toán là bản rút gọn, chưa xác minh mọi ngày trong toàn bộ khoảng lịch 1900–2100.

Đây là **giao diện web**, chưa phải ứng dụng tvOS, Android TV hoặc launcher thay màn hình chính của TV. Hẹn giờ kết thúc khi đóng/tải lại trang. Việc đóng gói cho nền tảng TV và mở ứng dụng native là phần phát triển tiếp theo nếu được yêu cầu.

## 8. Gợi ý ưu tiên khi làm tiếp

1. Xác nhận phát nhạc YouTube thực tế và giữ trạng thái UI đúng với trình phát.
2. Kiểm tra điều hướng bằng remote/phím và tỷ lệ 16:9 ở 1920×1080, 3840×2160; độ rõ chữ khi nhìn xa.
3. Nếu cần, gộp các quy tắc CSS trùng sau khi đã so sánh giao diện, giữ nguyên thiết kế hiện đại.
4. Chỉ thêm đồng bộ ảnh, backend hoặc gói ứng dụng TV sau khi chốt nhu cầu cụ thể.
