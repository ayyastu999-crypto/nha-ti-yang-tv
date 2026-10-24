# Nguồn và ghi công

## Ảnh minh họa

Sáu ảnh minh họa lấy từ Unsplash. Metadata nguồn được giữ trong `dist/assets/photo-sources.json`; một số tên ảnh trong metadata là tên gốc trước khi đóng vào giao diện. Bảng sau ánh xạ đúng tệp đang dùng:

| Tệp trong gói | Tên gốc trong metadata | Tác giả | Trang nguồn |
| --- | --- | --- | --- |
| `dist/assets/photo-1.jpg` | `rice-terraces.jpg` | Peter Hammer | https://unsplash.com/photos/scenery-of-rice-fields-ggQy5lGtwb0 |
| `dist/assets/photo-2.jpg` | `wildflowers.jpg` | Damian | https://unsplash.com/photos/wildflowers-bloom-in-a-sunny-green-meadow-wpofCJ9fCCc |
| `dist/assets/photo-3.jpg` | `ninh-binh.jpg` | seb. | https://unsplash.com/photos/green-grass-field-near-lake-during-daytime-MOsRi5Ou_mU |
| `dist/assets/lakeside-trail.jpg` | `lakeside-trail.jpg` | Sylvain Cleymans | https://unsplash.com/photos/a-trail-winds-through-a-grassy-field-with-mountains-in-the-background-kSqE3Hnphuw |
| `dist/assets/sea-sunset.jpg` | `sea-sunset.jpg` | marina negrete | https://unsplash.com/photos/calm-sea-during-sunset-6cVfi9tHyOA |
| `dist/assets/golden-sea.jpg` | `golden-sea.jpg` | Giorgio Trovato | https://unsplash.com/photos/calm-sea-under-orange-sky-during-sunset-cIcfyNgrVE0 |

Giấy phép tham khảo: https://unsplash.com/license

Các ảnh này là ảnh stock minh họa, không phải ảnh gia đình của người dùng. Không áp dụng một giấy phép mã nguồn mới lên các tài sản bên thứ ba.

## Lịch âm

`dist/lunar.mjs` dựa trên công thức trong bài “Thuật toán tính âm lịch” của Hồ Ngọc Đức, bản sao truy cập được tại:

https://xemamlich.uhm.vn/calrules.html

Nguồn gốc được dẫn trong bài:

http://www.informatik.uni-leipzig.de/~duc/amlich/

## YouTube

Trình phát sử dụng API nhúng chính thức:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters
- https://charts.youtube.com/

Playlist cấu hình ban đầu:

https://www.youtube.com/playlist?list=PL4fGSI1pDJn4bRKr6tjRWaGlqRg_zY_is

Lofi Girl cấu hình ban đầu:

https://www.youtube.com/watch?v=jfKfPfyJRdk

Video, âm nhạc và thương hiệu thuộc các chủ sở hữu tương ứng; chúng không được tải xuống hay đóng kèm dưới dạng file âm thanh/video trong ZIP.
