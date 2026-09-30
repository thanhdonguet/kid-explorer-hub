# Đảo Khám Phá · Kid Explorer Hub

Web app học mà chơi dành cho trẻ em, gồm sáu trò chơi tiếng Việt / tiếng Anh. Giao diện dùng đảo đồ chơi 3D, mô hình low-poly và màu sắc nhẹ nhàng trên nền SPA.

## Chạy tại máy

Yêu cầu Node.js 22 LTS và npm.

```sh
npm ci
npm run build
npm run dev
```

Trên Windows PowerShell, nếu `npm` bị chặn bởi execution policy, dùng `npm.cmd ci`, `npm.cmd run build`, `npm.cmd run dev` và `npm.cmd test`; không cần đổi execution policy.

Mở **http://localhost:4173/**. Server lắng nghe trên mạng nội bộ; có thể mở `http://<IP-máy>:4173` trên điện thoại cùng Wi-Fi nếu firewall cho phép. Service worker cần HTTPS hoặc localhost, nên truy cập bằng IP HTTP chỉ dùng để kiểm tra giao diện.

Sau khi sửa mã nguồn hoặc tài nguyên trong `www/`, chạy lại `npm run build` rồi tải lại trang. Không chỉnh trực tiếp `www/js/explorer-3d.bundle.js` hoặc `www/asset-list.js` vì chúng được tạo tự động.

## Sáu trò chơi

| Trò chơi | Nội dung học | Đồ họa và tương tác |
| --- | --- | --- |
| Khu Rừng Trí Nhớ | Ghép cặp, ghi nhớ; 5/10/15 cặp | Thẻ lật với thú và đồ vật 3D, kỷ lục thời gian theo độ khó |
| Xưởng Pha Màu | Nhận biết và pha màu tự do | 20 chai màu, tối đa 8 lượt thêm màu mỗi bát; kéo thả hoặc bàn phím, đổ bát để chơi tiếp |
| Chợ Trái Cây | Đếm từ 1 đến 10, năm lượt | Gấu 3D, trái cây GLB, chạm để cho vào giỏ |
| Bong Bóng Chữ Cái | 26 chữ cái và từ vựng tiếng Anh | Đồ chơi nổi, mô hình hoặc thẻ minh họa 3D; năm từ mỗi phiên |
| Khủng Long Sắc Màu | Sáu màu qua thức ăn | Dino đổi màu trực tiếp trên vật liệu 3D, giọng đọc có sẵn |
| Bến Xe Thành Phố | Phân loại 20 phương tiện; chọn trong bốn bến mỗi lượt | Xe và nhà bến 3D, kéo thả hoặc chạm bến; năm lượt |

Điểm sao, ngôn ngữ và kỷ lục trí nhớ lưu trên trình duyệt. Không cần tài khoản hay backend. Giọng đọc hệ thống phụ thuộc trình duyệt và các giọng đã cài.

Game Khủng Long Sắc Màu dùng ID `dinosaur-colors`, class `DinosaurColors` và file [dinosaur-colors.js](www/js/games/dinosaur-colors.js). Đây là trò cho Dino ăn để học màu, không phải bảng vẽ. Việc đổi tên không ảnh hưởng dữ liệu lưu vì ID game không được lưu trong `localStorage`.

## Công nghệ và quyết định triển khai

- **Vanilla JavaScript + Three.js 0.186.0 / WebGL2**: bổ sung đồ họa 3D vào các game hiện có, giữ DOM cho chữ, nút, bàn phím, kéo thả và cuộn. Không thêm framework UI hoặc engine game lớn.
- **GLB/glTF**: mô hình low-poly tải từ cùng website, texture nhúng trong file; không phụ thuộc CDN lúc chơi.
- **esbuild**: đóng gói renderer và manifest mô hình thành một bundle cục bộ.
- **PWA + Web Audio + Web Speech**: chơi offline sau lần tải đầy đủ; hiệu ứng dùng oscillator nhiều lớp, ADSR, filter, reverb sinh bằng code và sample CC0 nhỏ. Nhạc nền tùy chọn mặc định tắt và chỉ tải khi bé bật. Không cần dịch vụ nhận diện màu bên ngoài.
- **Capacitor 6**: có dependency và cấu hình `webDir: "www"` cho hướng mobile; chưa có project Android/iOS trong repository, chưa xác minh build native.

`www/js/explorer-3d.js` đăng ký custom element `<kid-model>`. Một WebGL context dùng chung render các cảnh nhỏ sang canvas trong từng phần tử DOM. Mô hình và geometry được tái sử dụng; cảnh tĩnh chỉ vẽ lại khi cần, cảnh ngoài màn hình không render, tab ẩn dừng vòng vẽ, chuyển động tôn trọng `prefers-reduced-motion`. Độ phân giải và tần số vẽ được giới hạn để giảm tải.

Đây là các mô hình 3D được kết hợp với giao diện DOM. Không phải thế giới 3D đi lại tự do hay mô phỏng vật lý. Một phần từ vựng chưa có mô hình riêng dùng ảnh minh họa trên thẻ 3D có độ dày; chưa phải toàn bộ từ vựng đều là vật thể 3D độc lập. Khi WebGL2 không có hoặc tải mô hình thất bại, hình gốc vẫn hiển thị để tiếp tục chơi.

Ảnh trên thẻ minh họa được vẽ vào canvas 256×256, giữ đúng tỉ lệ, trước khi tạo texture WebGL. Cách này tránh lỗi upload SVG chỉ có `viewBox` trên Chromium. Ảnh gốc vẫn hiển thị trong lúc tải; chỉ ẩn sau khi cảnh 3D đã sẵn sàng và được render.

## Nguồn tài nguyên

Đã tuyển chọn **51 mô hình**: 41 mô hình CC0 từ các kit Food/Car/Nature của Kenney, một mô hình ếch CC0 của Quaternius, và 9 mô hình động vật CC BY 3.0 của Poly by Google. Mỗi con vật dùng mesh và silhouette riêng thay cho một mẫu gấu bông đổi màu. Nguồn và license nằm trong `www/img/models/LICENSE-*.txt`.

Khủng long, đảo, nhà bến và một số đồ chơi được dựng bằng code trong renderer. Động vật ưu tiên mô hình GLB riêng; renderer cũng có thú procedural dùng ở các cảnh dựng sẵn hoặc fallback. Sample giao diện lấy từ Kenney Interface Sounds; nhạc nền tùy chọn là Short Plingy Loop của Fupi, đều CC0. Ảnh từ vựng Twemoji giữ giấy phép CC BY 4.0. Xem [trang nguồn tài nguyên](www/credits.html) để biết đầy đủ giấy phép và thông tin cho phụ huynh.

Các GLB đã nhập sẵn vào repo: **build thông thường không cần tải lại asset**. Để nhập lại toàn bộ, cần chuẩn bị cả ba gói gốc trong `.asset-cache/food`, `.asset-cache/car`, `.asset-cache/nature` **và** 10 GLB động vật đã tối ưu trong `.asset-cache/proper-animals-optimized/` (tên file: `lion`, `monkey`, `panda`, `rabbit`, `fox`, `frog`, `elephant`, `penguin`, `bear`, `cat`, đuôi `.glb`). `.asset-cache/` không được theo dõi bởi Git và không có sẵn sau khi clone. Sau đó chạy:

```sh
npm run assets:import
npm run build
```

Script tuyển chọn file, nhúng texture và sinh `manifest.json`. File nguồn quả bơ bổ đôi trong Food Kit có tên `advocado-half.glb`, được ánh xạ sang tên `avocado` trong app. Script không tự tải hoặc tối ưu mô hình động vật; nguồn và attribution nằm trong `www/img/models/LICENSE-animal.txt`.

Các script `download_aj.ps1`, `download_assets.js`, `download_assets.ps1` và `download_mega.ps1` là công cụ thu thập SVG từ các giai đoạn cũ, không phải pipeline tái tạo đầy đủ bộ asset hiện tại. Không chạy hàng loạt để ghi đè các hình đã chỉnh sửa. `download_dino_tts.ps1` tạo WAV bằng giọng Windows đã cài; `download_dino_tts.js` là thử nghiệm tải MP3 cũ, không tạo định dạng WAV mà game đang dùng.

## Kiểm thử

Thẻ từ vựng có nút nghe lại; mô hình 3D tự xoay chậm một vòng khoảng 18 giây, không có nút xoay thủ công. Thẻ minh họa, ảnh fallback và chế độ giảm chuyển động (`prefers-reduced-motion`) không tự xoay. Renderer không vẽ khi thẻ ngoài màn hình hoặc tab bị ẩn. Test render 41 mục từ và tạo ảnh contact sheet tại `test-results/vocabulary-3d-contact-sheet.png` khi chạy; ảnh này không có sẵn sau khi clone.

```sh
npm test
```

Playwright dùng Chrome đã cài (`channel: chrome`). Nếu máy chưa có Chrome, cài Chrome trước hoặc đổi cấu hình sang Chromium của Playwright. Test tự bật server nếu cổng 4173 chưa được dùng. Có thể chạy `npm run dev` trước và để test dùng lại server.

Bộ test kiểm tra tham chiếu tài nguyên, texture GLB, vào được cả sáu game, hoàn thành các game có lượt chơi và pha/reset màu ở chế độ chơi tự do, chống tính điểm lặp khi chạm nhanh, hủy timer lúc đổi game, VI/EN, thao tác chuột và touch, bố cục 320/390px và ngang 844px, cache offline và fallback không có WebGL. Screenshot nằm trong `test-results/` sau khi chạy.

Vẫn cần thử trên thiết bị iOS/Android thực tế để đánh giá GPU, bộ nhớ, phát âm và pin; giả lập kích thước màn hình không thay thế kiểm thử phần cứng.

## Deploy web

Artifact triển khai là toàn bộ **`www/`** sau `npm run build`. Hỗ trợ host tĩnh như GitHub Pages, Cloudflare Pages hoặc Netlify; không cần SSR hoặc backend. Dùng HTTPS để cài PWA và cache offline.

Workflow `.github/workflows/deploy.yml` cài dependency bằng lockfile, build rồi upload `www/` lên GitHub Pages. **Push vào `main` sẽ kích hoạt deploy**; cũng có thể chạy workflow thủ công. Các đường dẫn asset tương đối hỗ trợ Pages dưới đường dẫn repo.

Service worker dùng hash nội dung của danh sách precache làm phiên bản cache. Một bản offline mới chỉ kích hoạt khi tải đủ danh sách này; cache cũ của app được dọn sau đó. HTML/JS/CSS/JSON dùng network-first, ảnh và âm thanh dùng cache-first. Không xóa cache của ứng dụng khác cùng origin.

Giọng đọc hệ thống có thể vẫn cần mạng tùy thiết bị. Google Fonts được tải ngoài và có font hệ thống thay thế. Nhạc nền không nằm trong precache: cần bật khi có mạng để tải và cache trước khi có thể nghe offline. Mã nguồn renderer, service worker và danh sách precache không nằm trong danh sách asset precache; bundle renderer được cache để chạy game offline.

Nếu bản cập nhật đến trong lúc bé đang chơi, trang đợi bé quay về đảo rồi mới tải lại để không làm mất lượt chơi đang diễn ra.
