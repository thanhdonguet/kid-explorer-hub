# LỆNH TRIỂN KHAI — Material động vật, Âm thanh, Bug Pha Màu

Repo: `kid-explorer-hub` · Base commit: `52bd6fb` · Nhánh: `main`
Đọc `.agents/AGENTS.md` trước khi bắt đầu và tuân thủ toàn bộ rule trong đó (vanilla ES6+, không thêm framework UI, Web Audio, edit cục bộ không refactor tràn lan, tích hợp i18n vào `applyLang()`).

Trạng thái khởi điểm: `npm run build` sạch, `npm test` = 14/14 pass. **Kết thúc công việc phải vẫn 14/14 pass cộng thêm các test mới bên dưới.** Sau mỗi lần sửa `www/js/explorer-3d.js` phải chạy lại `npm run build` vì `www/js/explorer-3d.bundle.js` là file sinh tự động.

---

## NHIỆM VỤ 1 — Material động vật đang "một màu", phải làm đẹp hơn

### Nguyên nhân gốc (đã xác minh)

**1a. Palette bị dồn vào một dải màu.** `www/js/explorer-3d.js` dòng 104:

```js
const colors = { lion: '#e8af57', monkey: '#ab795d', panda: '#fffbec', rabbit: '#e9d3bc', fox: '#e98b4d', frog: '#74bd68', elephant: '#91b5c7', penguin: '#344f61', bear: '#b68560', cat: '#e9b774' };
```

Năm trong mười con — `lion #e8af57`, `monkey #ab795d`, `rabbit #e9d3bc`, `bear #b68560`, `cat #e9b774` — đều là nâu/vàng đất tầm trung, hue nằm trong khoảng ~25–40°, độ sáng gần nhau. Nhìn ra là cùng một con vật đổi sắc độ.

**1b. Mười con dùng chung một silhouette.** Hàm `animal(parent, name)` dòng 101–126: mọi con đều là body ball + head ball + snout patch + 2 chân + 2 tai + mắt. Phần riêng chỉ có: lion thêm vòng bờm, panda thêm vệt mắt, penguin thêm bụng + mỏ, rabbit tai dài, fox/cat tai chóp, elephant vòi + tai to, frog bọng mắt. **`monkey`, `bear`, `cat` gần như không có hình học riêng nào** ngoài màu. Không con nào có đuôi.

**1c. Mỗi con chỉ đúng một màu duy nhất.** Thân, đầu, cả bốn chi và tai đều gọi `ball(g, color, ...)` với cùng một hex. Không có màu phụ cho bụng, mõm, bàn chân, đuôi, vành tai.

**1d. Material hoàn toàn phẳng.** Dòng 17–21:

```js
new THREE.MeshStandardMaterial({ color, roughness: gloss ? .26 : .72, metalness: 0 })
```

Không `map`, không `normalMap`, không `roughnessMap`, không `aoMap`, không vertex color, không biến thiên bề mặt. Đây chính là cảm giác "nhựa một màu". Lighting (dòng 545–547: hemisphere + key + fill) thực ra ổn, nhưng material không có gì để lighting bám vào.

### Yêu cầu

Làm **cả hai** hướng dưới đây.

**Hướng A — thay bằng model GLB thật (ưu tiên, tác động lớn nhất).**

Repo đã có sẵn pipeline import cho Kenney kit: `import-assets.mjs` + `.asset-cache/{food,car,nature}` + sinh `www/img/models/manifest.json`. Mở rộng pipeline này cho category `animal`.

Nguồn CC0 nên dùng (kiểm tra file license trong gói tải về, đừng tin mô tả trang web):
- Kenney **Animal Pack Redux** — CC0 — https://kenney.nl/assets/animal-pack-redux
- Quaternius **Stylized Animals / Ultimate Animated Animals** — CC0 — https://quaternius.com/
- Poly Pizza — https://poly.pizza — lọc theo CC0

Người dùng nói không lo bản quyền vì không bán app. Vẫn nên ưu tiên CC0 vì lý do thực dụng: repo này **public** trên GitHub và đã có `www/credits.html` + `www/img/models/LICENSE-*.txt`. Nếu bạn dùng asset CC-BY thì phải thêm attribution vào `credits.html`.

Ràng buộc kỹ thuật khi import:
- Texture phải **nhúng trong file GLB** (test `all referenced vocabulary and embedded GLB resources exist` kiểm tra điều này).
- Mỗi GLB ≤ ~300 KB để khớp mức hiện tại (file lớn nhất đang là `car-garbage-truck.glb` 0.27 MB).
- `www/` hiện 9.6 MB / 326 file. **Giữ tổng dưới ~15 MB.** Đây là lượng tải lần đầu của PWA.
- `animal()` phải thử GLB trước, nếu thiếu model thì fallback về hình procedural hiện tại. Giữ nguyên contract attribute `data-model-kind` (`mesh` | `illustration`) vì test dựa vào nó.
- Giữ nguyên đường fallback khi không có WebGL2 (test `without WebGL, fallback images and all game routes remain usable`).

**Hướng B — nâng chất lượng material dùng chung, cho cả các vật procedural còn lại.**

- Giãn palette động vật ra các hue tách biệt rõ, đừng để 5 con cùng dải nâu. Mỗi con cần **màu chính + màu phụ** (bụng/mõm/bàn chân/vành tai/đuôi khác màu thân).
- Thêm biến thiên bề mặt vào `material()`: sinh procedural texture bằng canvas (noise nhẹ cho cảm giác nỉ/lông, hoặc gradient subtle) rồi dùng làm `map`/`roughnessMap`. **Không tải texture PNG rời** — repo ưu tiên asset nhỏ và offline. Cache texture theo key giống cơ chế `materials`/`geometries` Map hiện có.
- Thêm hình học riêng cho `monkey`, `bear`, `cat` và thêm đuôi cho các con phù hợp.
- Giữ nguyên tinh thần tối ưu hiện có: cache material/geometry, `disposeOwned` cho material tự tạo (phải set `userData.owned = true`, xem dòng 60 và 84 làm mẫu), không phá cơ chế chỉ render khi `dirty`.

### Kiểm chứng

Thêm test Playwright dựng contact sheet cả 10 con vật (làm theo mẫu test `learning objects render as full meshes...` dòng 146 trong `tests/explorer.spec.cjs`), lưu screenshot vào `test-results/`, và assert hai con bất kỳ không được có cùng màu trung bình pixel — để palette không bao giờ bị dồn lại như hiện tại nữa.

---

## NHIỆM VỤ 2 — Âm thanh đang quá đơn thuần, tìm nguồn nghe hay hơn

### Trạng thái hiện tại (đã xác minh)

`www/js/audio.js` (9.1 KB) — class `SoundEngine` với 12 cue: `playTap`, `playPop`, `playSuccess`, `playFail`, `playCheer`, `playCardFlip`, `playMatch`, `playMismatch`, `playLevelComplete`, `playMiss`, `playPaint`.

Vấn đề:
- Toàn bộ là oscillator trần (sine/square/triangle) + gain ramp tuyến tính. Chỉ `playCardFlip` có một buffer white-noise. Không reverb, không layer, không filter envelope.
- **Không random pitch.** Mỗi lần gọi phát ra đúng một tần số cố định. `playTap` được gọi ở **15 chỗ** trong codebase — nghe lặp đến mức mỏi tai.
- Âm thanh thu thật duy nhất là 8 file giọng Việt của Dino: `www/audio/dino/*.wav`, tổng ~1.1 MB.
- **Không có nhạc nền.**

### Yêu cầu

Giữ Web Audio làm nền tảng (rule của project) nhưng nâng hẳn chất lượng:

**2a. Nâng synthesis.** ADSR envelope đúng nghĩa thay cho ramp thẳng; layer nhiều partial/harmonic; một convolution reverb dùng chung với impulse response **sinh bằng code** (đừng thêm file IR nặng); filter envelope có chuyển động; **random detune ±1 semitone và biến thiên velocity mỗi lần gọi** để tap lặp lại không mỏi tai.

**2b. Thêm sample nén cho các thời điểm quan trọng nhất** — nơi synthesis không cạnh tranh được: fanfare thắng, thu sao, lật thẻ, bong bóng nổ. Dùng Ogg/Opus hoặc M4A, **tổng ≤ 300 KB**. Nguồn CC0: Kenney Audio packs (Interface Sounds, UI Audio, Casual Audio — đều CC0), subset CC0 của freesound.org, Mixkit.

**2c. Nhạc nền nhẹ cho dashboard**, mặc định TẮT, tôn trọng nút mute sẵn có. Loop ngắn, Opus, ≤ 1 MB. Tải **lazy**, không nằm trong precache.

### Hai cái bẫy phải tránh

**Bẫy 1 — ngân sách offline.** `build.mjs` dòng 7 walk **toàn bộ** `www/` và đưa mọi file vào `www/asset-list.js`:

```js
const files = walk('www').filter(p => !p.endsWith('/sw.js') && !p.endsWith('/asset-list.js') && !p.endsWith('/explorer-3d.js'));
```

Nghĩa là mọi file audio mới **tự động bị precache**, đội lượng tải lần đầu lên. Nhạc nền bắt buộc phải được loại khỏi danh sách này (thêm filter theo mẫu có sẵn) và tải on-demand.

**Bẫy 2 — gesture requirement của iOS.** Repo đã từng vỡ đúng chỗ này, xem commit `e443ef0` ("undo TTS defer that broke iOS Safari's gesture requirement") và `806fb24`. **Không** tạo hoặc resume `AudioContext` ngoài user gesture. Giữ đúng semantics `init()` / `resume()` hiện có (dòng 8–22) và trạng thái `this.muted` / `toggleMute()` cùng nút `#btn-sound`.

### Kiểm chứng

Test assert: nút mute vẫn chặn được toàn bộ âm thanh mới (kể cả nhạc nền); `AudioContext` không được khởi tạo trước gesture đầu tiên; tổng kích thước `www/` vẫn dưới ngân sách; nhạc nền không có trong `asset-list.js`.

---

## NHIỆM VỤ 3 — Bug game Pha Màu: các màu pha về sau không đổi kết quả

File: `www/js/games/color-mix.js`. Bug là **thật**, và có tới 6 nguyên nhân chồng nhau.

### Nguyên nhân gốc (đã xác minh)

**3a. NGUYÊN NHÂN CHÍNH — fallback là trung bình cộng RGB.** `_computeMix()` dòng 501–505:

```js
const r = Math.round(this.mixedColors.reduce((s, c) => s + c.r, 0) / this.mixedColors.length);
```

Thêm màu thứ n chỉ dịch kết quả đi `(c_new − mean) / n`. Khi trong bát đã có 4 màu, màu thứ 5 chỉ dịch được 20% khoảng cách. Đồng thời trung bình cộng nhiều màu bão hòa luôn hội tụ về xám giữa ~(128,128,128). Đúng y hệt hiện tượng người dùng thấy.

**3b. Recipe tra cứu bằng `Set` nên xóa mất màu trùng.** Dòng 456:

```js
const uniqueIds = Array.from(new Set(this.mixedColors.map(c => c.id))).sort().join('+');
```

Thả thêm một giọt đỏ nữa vào `red+yellow` vẫn cho `uniqueIds === 'red+yellow'` → kết quả đứng nguyên Orange, **không đổi một pixel**.

**3c. Bảng recipe phủ quá ít.** Dòng 458–492 có 24 công thức. Palette có 20 màu (dòng 20–40), cho phép tới 5 giọt → khoảng 21.700 tập hợp khả dĩ. Tức **hơn 99% trường hợp rơi vào đường trung bình xám** ở 3a.

**3d. Nhiều recipe là ánh xạ bất động.** `'gold+yellow': 'gold'`, `'orange+red+yellow': 'orange'`, `'blue+green+yellow': 'green'`, `'pink+red+white': 'pink'`, `'black+gray+white': 'gray'`. Vào các trạng thái này rồi thì thêm màu được liệt kê **chắc chắn không đổi gì**.

**3e. Cap cứng 5 giọt.** `_endDrag()` dòng 304: `if (this.mixedColors.length < 5)`, ngược lại chỉ shake bát. Giọt thứ 6 trở đi **không làm gì cả**.

**3f. Lỗi i18n.** Dòng 309 hardcode tiếng Anh: `this._speak('Bowl is full')`. Vi phạm rule tích hợp i18n trong `.agents/AGENTS.md`.

Phụ: `_computeMix()` bị gọi trùng — dòng 335 `_updateBowl()` gọi nó, rồi dòng 355 gọi lại, rồi trong `_updateBowl` dòng 400 gọi lần nữa.

### Yêu cầu

**3g. Thay toàn bộ phép toán trộn màu.** Trung bình cộng RGB là mô hình sai — đó là lý do phải chắp vá bảng recipe. Trộn màu vẽ là **subtractive**. Hãy cài mô hình xấp xỉ **Kubelka-Munk** có trọng số, viết vanilla trong file, không thêm dependency.

Người dùng đã xác nhận không dùng thương mại, nên **Mixbox** (Secret Weapons, free cho non-commercial) là lựa chọn hợp lệ nếu bạn muốn chất lượng trộn cao nhất — nó cho blue + yellow = green đúng như sơn thật. Đánh đổi là kích thước lookup table. Tự cân, nhưng nếu dùng thì phải nằm trong ngân sách offline ở Nhiệm vụ 2.

**3h. Bảo đảm mọi giọt đều làm kết quả đổi thấy được.**
- Đếm **số lượng từng màu** làm trọng số, bỏ cách dùng `Set`. Giọt đỏ thứ hai phải làm kết quả đỏ hơn.
- Nâng cap từ 5 lên 8–10 giọt. Khi đầy thật thì thông báo phải **localized** và có tín hiệu thị giác rõ.
- Sau mỗi giọt, tính ΔE (CIE76 hoặc CIE94 trong không gian Lab) giữa kết quả cũ và mới. ΔE dưới ngưỡng cảm nhận được nghĩa là mô hình sai — biến điều này thành test, đừng chỉ tính rồi bỏ đó.

**3i. Giữ bảng recipe nhưng chỉ làm tầng ĐẶT TÊN, không phải tầng tính màu.** Red + yellow vẫn phải đọc là "Orange" để bé học đúng. Có thể snap màu cho các cặp cơ bản kinh điển mà trẻ cần học, còn lại để phép toán thật lo.

**3j. Sửa `_getColorObj()` dòng 508.** Đang tìm tên màu gần nhất bằng khoảng cách Euclid trong RGB — sai về mặt cảm nhận. Đổi sang ΔE trong Lab.

**3k. Sửa lỗi i18n ở 3f** — đưa chuỗi vào bảng `t` của game (xem dòng 104 làm mẫu) và nối vào `applyLang()` trong `www/js/app.js`.

**3l. Dọn việc gọi `_computeMix()` trùng lặp.**

### Kiểm chứng

Test hiện có phải giữ xanh: `mix recipes update the 3D bowl, keyboard works, reset clears` (dòng 81 trong `tests/explorer.spec.cjs`). Thêm:

- Thả 8 giọt liên tiếp: mỗi bước `#cmx-result-hex` **và** attribute `color` của `kid-model` đều phải đổi, assert ΔE mỗi bước vượt ngưỡng.
- Thả cùng một màu hai lần: kết quả phải dịch về phía màu đó.
- Các cặp kinh điển vẫn đặt tên đúng: red+yellow=Orange, blue+yellow=Green, red+blue=Purple, red+white=Pink, black+white=Gray.
- Thông báo bát đầy hiển thị đúng ở cả VI và EN.

---

## ĐIỀU KIỆN HOÀN THÀNH

1. `npm run build` chạy sạch; `www/js/explorer-3d.bundle.js` và `www/asset-list.js` được sinh lại, không sửa tay.
2. `npm test` xanh toàn bộ: 14 test cũ + test mới của cả ba nhiệm vụ.
3. Bố cục 320 px dọc và 844 px ngang không hồi quy.
4. Chế độ offline và fallback không-WebGL vẫn hoạt động.
5. `www/` vẫn dưới ~15 MB.
6. Asset mới không phải CC0 thì phải có attribution trong `www/credits.html`.
7. Cập nhật `README.md` phần nguồn tài nguyên và `.gitignore` nếu sinh thêm artifact build hoặc cache mới.
8. Commit theo rule: gộp thành các commit có nghĩa theo từng nhiệm vụ, đừng commit mỗi lần sửa.
