# Đảo Khám Phá · Kid Explorer Hub

Web app học mà chơi dành cho trẻ em, gồm sáu trò chơi tiếng Việt / tiếng Anh. Bản giao diện mới dùng đảo đồ chơi 3D, mô hình low-poly và màu sắc nhẹ nhàng; giữ nguyên cấu trúc SPA và các luật chơi.

## Chạy tại máy

Yêu cầu Node.js 22 LTS và npm.

```sh
npm ci
npm run build
npm run dev
```

Mở **http://localhost:4173/**. Server lắng nghe trên mạng nội bộ; có thể mở `http://<IP-máy>:4173` trên điện thoại cùng Wi-Fi nếu firewall cho phép. Service worker cần HTTPS hoặc localhost, nên truy cập bằng IP HTTP chỉ dùng để kiểm tra giao diện.

Sau khi sửa mã nguồn hoặc tài nguyên trong `www/`, chạy lại `npm run build` rồi tải lại trang. Không chỉnh trực tiếp `www/js/explorer-3d.bundle.js` hoặc `www/asset-list.js` vì chúng được tạo tự động.

## Sáu trò chơi

| Trò chơi | Nội dung học | Đồ họa và tương tác |
| --- | --- | --- |
| Khu Rừng Trí Nhớ | Ghép cặp, ghi nhớ; 5/10/15 cặp | Thẻ lật với thú và đồ vật 3D, điểm cao theo độ khó |
| Xưởng Pha Màu | Nhận biết và pha màu | 20 chai màu, bát và kết quả đổi màu; kéo thả hoặc bàn phím |
| Chợ Trái Cây | Đếm từ 1 đến 10, năm lượt | Gấu 3D, trái cây GLB, chạm để cho vào giỏ |
| Bong Bóng Chữ Cái | 26 chữ cái và từ vựng tiếng Anh | Đồ chơi nổi, mô hình hoặc thẻ minh họa 3D; năm từ mỗi phiên |
| Khủng Long Sắc Màu | Sáu màu qua thức ăn | Dino đổi màu trực tiếp trên vật liệu 3D, giọng đọc có sẵn |
| Bến Xe Thành Phố | Phân loại 20 phương tiện; chọn trong bốn bến mỗi lượt | Xe và nhà bến 3D, kéo thả hoặc chạm bến; năm lượt |

Điểm sao, ngôn ngữ và kỷ lục trí nhớ lưu trên trình duyệt. Không cần tài khoản hay backend. Giọng đọc hệ thống phụ thuộc trình duyệt và các giọng đã cài.

## Công nghệ và quyết định triển khai

- **Vanilla JavaScript + Three.js 0.186.0 / WebGL2**: bổ sung đồ họa 3D vào các game hiện có, giữ DOM cho chữ, nút, bàn phím, kéo thả và cuộn. Không thêm framework UI hoặc engine game lớn.
- **GLB/glTF**: mô hình low-poly tải từ cùng website, texture nhúng trong file; không phụ thuộc CDN lúc chơi.
- **esbuild**: đóng gói renderer và manifest mô hình thành một bundle cục bộ.
- **PWA + Web Audio + Web Speech**: chơi offline sau lần tải đầy đủ; hiệu ứng dùng oscillator nhiều lớp, ADSR, filter, reverb sinh bằng code và sample CC0 nhỏ. Nhạc nền tùy chọn mặc định tắt và chỉ tải khi bé bật. Không cần dịch vụ nhận diện màu bên ngoài.
- **Capacitor 6**: giữ phụ thuộc và cấu hình hiện có cho hướng mobile sau này; đợt nâng cấp này chỉ xác minh web, chưa build ứng dụng native.

`www/js/explorer-3d.js` đăng ký custom element `<kid-model>`. Một WebGL context dùng chung render các cảnh nhỏ sang canvas trong từng phần tử DOM. Mô hình và geometry được tái sử dụng; cảnh tĩnh chỉ vẽ lại khi cần, cảnh ngoài màn hình không render, tab ẩn dừng vòng vẽ, chuyển động tôn trọng `prefers-reduced-motion`. Độ phân giải và tần số vẽ được giới hạn để giảm tải.

Đây là các mô hình 3D được kết hợp với giao diện DOM. Không phải thế giới 3D đi lại tự do hay mô phỏng vật lý. Một phần từ vựng chưa có mô hình riêng dùng ảnh minh họa trên thẻ 3D có độ dày; chưa phải toàn bộ từ vựng đều là vật thể 3D độc lập. Khi WebGL2 không có hoặc tải mô hình thất bại, hình gốc vẫn hiển thị để tiếp tục chơi.

## Nguồn tài nguyên

Đã tuyển chọn **42 mô hình CC0**: 22 đồ ăn từ [Kenney Food Kit](https://kenney.nl/assets/food-kit), 11 xe từ [Kenney Car Kit](https://kenney.nl/assets/car-kit), 8 mô hình từ [Kenney Nature Kit](https://kenney.nl/assets/nature-kit), và một mô hình ếch của Quaternius. License gốc nằm trong `www/img/models/LICENSE-*.txt`.

Khủng long, thú, đảo, nhà bến và một số đồ chơi được dựng bằng code trong renderer. Thú đồ chơi có silhouette, màu chính/phụ và texture nỉ procedural riêng thay cho một material phẳng dùng chung. Sample giao diện lấy từ Kenney Interface Sounds; nhạc nền tùy chọn là Short Plingy Loop của Fupi, đều CC0. Ảnh từ vựng Twemoji giữ giấy phép CC BY 4.0. Xem [trang nguồn tài nguyên](www/credits.html) để biết đầy đủ giấy phép và thông tin cho phụ huynh.

Các GLB đã nhập sẵn vào repo: **build thông thường không cần tải lại asset**. Nếu muốn nhập lại, giải nén ba gói gốc vào `.asset-cache/food`, `.asset-cache/car`, `.asset-cache/nature` rồi chạy:

```sh
npm run assets:import
npm run build
```

Script tuyển chọn file, nhúng texture và sinh `manifest.json`. File nguồn quả bơ bổ đôi trong Food Kit có tên `advocado-half.glb`, được ánh xạ sang tên `avocado` trong app. Mô hình ếch đã tối ưu nằm ở `.asset-cache/animals-optimized/frog.glb` khi cần chạy lại bước import.

## Kiểm thử

Đợt mở rộng từ vựng bổ sung 38 mục từ dùng mô hình 3D (gồm mô hình mới và tái sử dụng phương tiện), đồng thời dựng lại lá, trăng lưỡi liềm và mặt trời. Thẻ kết quả có nút nghe lại và xoay trái/phải 45° bằng cảm ứng hoặc bàn phím. Thẻ minh họa và chế độ fallback ẩn nút xoay. Ảnh contact sheet của 41 mục được kiểm tra nằm trong `test-results/vocabulary-3d-contact-sheet.png`.

```sh
npm test
```

Playwright dùng Chrome đã cài (`channel: chrome`). Nếu máy chưa có Chrome, cài Chrome trước hoặc đổi cấu hình sang Chromium của Playwright. Test tự bật server nếu cổng 4173 chưa được dùng. Có thể chạy `npm run dev` trước và để test dùng lại server.

Bộ test kiểm tra tham chiếu tài nguyên, texture GLB, sáu game hoàn thành phiên chơi, chống tính điểm lặp khi chạm nhanh, hủy timer lúc đổi game, VI/EN, thao tác chuột và touch, bố cục 320/390px và ngang 844px, cache offline và fallback không có WebGL. Screenshot nằm trong `test-results/` sau khi chạy.

Vẫn cần thử trên thiết bị iOS/Android thực tế để đánh giá GPU, bộ nhớ, phát âm và pin; giả lập kích thước màn hình không thay thế kiểm thử phần cứng.

## Deploy web

Artifact triển khai là toàn bộ **`www/`** sau `npm run build`. Hỗ trợ host tĩnh như GitHub Pages, Cloudflare Pages hoặc Netlify; không cần SSR hoặc backend. Dùng HTTPS để cài PWA và cache offline.

Workflow `.github/workflows/deploy.yml` cài dependency bằng lockfile, build rồi upload `www/` lên GitHub Pages. **Push vào `main` sẽ kích hoạt deploy**; cũng có thể chạy workflow thủ công. Các đường dẫn asset tương đối hỗ trợ Pages dưới đường dẫn repo.

Service worker dùng hash nội dung làm phiên bản cache. Một bản offline mới chỉ kích hoạt khi tải đủ tài nguyên; cache cũ của app được dọn sau đó. Không xóa cache của ứng dụng khác cùng origin. Lần cài đầu cần tải khoảng 10 MB tài nguyên; giọng đọc hệ thống có thể vẫn cần mạng tùy thiết bị.

Nếu bản cập nhật đến trong lúc bé đang chơi, trang đợi bé quay về đảo rồi mới tải lại để không làm mất lượt chơi đang diễn ra.
