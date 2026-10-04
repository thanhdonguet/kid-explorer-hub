/* Original three-picture stories and their locally drawn illustrations. */
(function (global) {
  const stories = [
    {
      id: 'cake', title: ['Chiếc bánh sinh nhật', 'A birthday cake'],
      steps: [
        ['mix', 'Trộn bột bánh', 'Mix the cake batter', 'Trộn các nguyên liệu thành bột trước khi nướng bánh.', 'Mix the ingredients into batter before baking the cake.'],
        ['bake', 'Nướng bánh', 'Bake the cake', 'Bột bánh được nướng thành bánh trước khi trang trí.', 'Bake the batter into a cake before decorating it.'],
        ['decorate', 'Trang trí bánh', 'Decorate the cake', 'Bánh nướng đã nguội rồi mới phủ kem và trang trí.', 'Let the baked cake cool, then add icing and decorations.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['shoe', 'Đặt giày vào bát', 'Put a shoe in the bowl'],
      extraHint: ['Giày không phải nguyên liệu làm bánh. Hãy trả hình này về khay.', 'A shoe is not a cake ingredient. Return this picture to the tray.'],
      reward: 'flower', rewardName: ['Bông hoa', 'Flower'],
    },
    {
      id: 'butterfly', title: ['Chú sâu hóa bướm', 'A caterpillar becomes a butterfly'],
      steps: [
        ['caterpillar', 'Sâu ăn lá và lớn lên', 'A caterpillar eats and grows', 'Chú sâu ăn lá và lớn lên trước khi thành nhộng.', 'The caterpillar eats leaves and grows before becoming a chrysalis.'],
        ['chrysalis', 'Sâu trở thành nhộng', 'The caterpillar becomes a chrysalis', 'Bên trong nhộng, chú sâu thay đổi trước khi bướm xuất hiện.', 'Inside the chrysalis, the caterpillar changes before a butterfly appears.'],
        ['butterfly', 'Bướm chui ra', 'A butterfly emerges', 'Sau một thời gian trong nhộng, bướm chui ra và mở cánh.', 'After time in the chrysalis, a butterfly emerges and opens its wings.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['balloon', 'Thổi một quả bóng', 'Blow up a balloon'],
      extraHint: ['Quả bóng không phải một bước lớn lên của bướm. Hãy trả hình này về khay.', 'A balloon is not part of a butterfly growing up. Return this picture to the tray.'],
      reward: 'flower', rewardName: ['Bông hoa', 'Flower'],
    },
    {
      id: 'bird', title: ['Tổ chim nhỏ', 'A little bird nest'],
      steps: [
        ['nest', 'Chim làm tổ', 'A bird builds a nest', 'Chim làm tổ để có chỗ đặt những quả trứng.', 'The bird builds a nest to hold its eggs.'],
        ['eggs', 'Chim ấp trứng', 'The bird keeps its eggs warm', 'Trứng nằm trong tổ và được ấp trước khi chim con nở.', 'The eggs stay warm in the nest before the chicks hatch.'],
        ['chicks', 'Chim con nở', 'The chicks hatch', 'Sau khi được ấp, chim con chui ra khỏi vỏ trứng.', 'After the eggs are kept warm, chicks hatch from their shells.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['kite', 'Thả diều', 'Fly a kite'],
      extraHint: ['Cánh diều không giúp trứng nở. Hãy trả hình cánh diều về khay.', 'A kite does not help the eggs hatch. Return the kite picture to the tray.'],
      reward: 'tree', rewardName: ['Cây xanh', 'Tree'],
    },
    {
      id: 'weather', title: ['Cầu vồng sau mưa', 'A rainbow after the rain'],
      steps: [
        ['clouds', 'Mây mưa kéo đến', 'Rain clouds arrive', 'Mây mưa kéo đến trước khi những giọt mưa rơi xuống.', 'Rain clouds arrive before the raindrops fall.'],
        ['rain', 'Mưa rơi', 'Rain falls', 'Những giọt nước rơi từ mây xuống đất.', 'Drops of water fall from the clouds to the ground.'],
        ['rainbow', 'Nắng lên, cầu vồng hiện ra', 'Sunshine brings a rainbow', 'Khi nắng chiếu qua những giọt mưa, ta có thể thấy cầu vồng.', 'When sunlight shines through raindrops, we may see a rainbow.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['lamp', 'Bật đèn bàn', 'Turn on a desk lamp'],
      extraHint: ['Đèn bàn không làm cầu vồng hiện trên trời. Hãy trả hình này về khay.', 'A desk lamp does not make a rainbow in the sky. Return this picture to the tray.'],
      reward: 'flower', rewardName: ['Bông hoa', 'Flower'],
    },
    {
      id: 'paper-boat', title: ['Chiếc thuyền giấy', 'A little paper boat'],
      steps: [
        ['fold', 'Gấp tờ giấy', 'Fold the paper', 'Gấp tờ giấy trước để tạo hình chiếc thuyền.', 'Fold the paper first to make the shape of a boat.'],
        ['boat', 'Mở thành chiếc thuyền', 'Open the paper into a boat', 'Mở các nếp gấp thành thuyền trước khi đặt lên nước.', 'Open the folds into a boat before placing it on water.'],
        ['float', 'Thuyền nổi trên nước', 'The boat floats on water', 'Đặt chiếc thuyền đã gấp xong lên mặt nước.', 'Place the finished paper boat on the water.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['stone', 'Thả hòn đá xuống nước', 'Drop a stone into the water'],
      extraHint: ['Hòn đá không biến thành thuyền giấy. Hãy trả hình này về khay.', 'A stone does not become a paper boat. Return this picture to the tray.'],
      reward: 'rabbit', rewardName: ['Bạn thỏ', 'Rabbit friend'],
    },
    {
      id: 'toys', title: ['Căn phòng gọn gàng', 'A tidy playroom'],
      steps: [
        ['scattered', 'Đồ chơi nằm khắp sàn', 'Toys are scattered on the floor', 'Đồ chơi còn nằm trên sàn trước khi bé bắt đầu dọn.', 'The toys are still on the floor before the child starts tidying.'],
        ['sort', 'Nhặt đồ chơi vào hộp', 'Put the toys in the box', 'Nhặt từng món đồ chơi trên sàn rồi đặt vào hộp.', 'Pick up the toys from the floor and put them in the box.'],
        ['tidy', 'Sàn nhà đã gọn', 'The floor is tidy', 'Khi đồ chơi đã ở trong hộp, sàn nhà trở nên gọn gàng.', 'Once the toys are in the box, the floor is tidy.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['paint', 'Đổ sơn ra sàn', 'Spill paint on the floor'],
      extraHint: ['Sơn đổ ra làm sàn bẩn hơn. Hãy trả hình này về khay.', 'Spilled paint makes the floor messier. Return this picture to the tray.'],
      reward: 'rabbit', rewardName: ['Bạn thỏ', 'Rabbit friend'],
    },
    {
      id: 'school', title: ['Một buổi đến trường', 'A morning at school'],
      steps: [
        ['pack', 'Xếp sách vào ba lô', 'Pack books in the backpack', 'Xếp sách vào ba lô để sẵn sàng đến trường.', 'Pack the books in the backpack to get ready for school.'],
        ['walk', 'Đeo ba lô đến trường', 'Carry the backpack to school', 'Sau khi chuẩn bị ba lô, bé đi đến trường.', 'After packing the backpack, the child goes to school.'],
        ['class', 'Ngồi học trong lớp', 'Learn in the classroom', 'Đến trường rồi, bé vào lớp và mở sách học.', 'After arriving at school, the child enters the classroom and opens a book.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['bed', 'Nằm ngủ trên giường', 'Sleep in bed'],
      extraHint: ['Ngủ trên giường không phải bước tiếp theo của buổi đến lớp này. Hãy trả hình này về khay.', 'Sleeping in bed is not the next step in this school morning. Return this picture to the tray.'],
      reward: 'tree', rewardName: ['Cây xanh', 'Tree'],
    },
    {
      id: 'sandcastle', title: ['Lâu đài trên cát', 'A castle in the sand'],
      steps: [
        ['fill', 'Xúc cát vào xô', 'Fill the bucket with sand', 'Cho cát ẩm vào xô trước để cát giữ được hình.', 'Fill the bucket with damp sand so the sand can hold its shape.'],
        ['turn', 'Úp xô xuống cát', 'Turn the bucket upside down', 'Úp chiếc xô đầy cát xuống bãi cát trước khi nhấc xô lên.', 'Turn the filled bucket upside down on the sand before lifting it.'],
        ['castle', 'Nhấc xô, được lâu đài', 'Lift the bucket to reveal a castle', 'Nhấc xô lên để nhìn thấy lâu đài cát bên dưới.', 'Lift the bucket to reveal the sandcastle underneath.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['leaves', 'Đổ lá vào xô', 'Fill the bucket with leaves'],
      extraHint: ['Lá cây không giữ hình thành lâu đài cát. Hãy trả hình này về khay.', 'Leaves do not hold the shape of a sandcastle. Return this picture to the tray.'],
      reward: 'tree', rewardName: ['Cây xanh', 'Tree'],
    },
    {
      id: 'laundry', title: ['Chiếc áo sạch thơm', 'A clean, dry shirt'],
      steps: [
        ['wash', 'Giặt chiếc áo', 'Wash the shirt', 'Giặt chiếc áo bẩn trước khi đem phơi.', 'Wash the dirty shirt before hanging it up.'],
        ['hang', 'Phơi áo còn ướt', 'Hang the wet shirt', 'Áo vừa giặt còn ướt nên cần được phơi cho khô.', 'The freshly washed shirt is wet, so hang it up to dry.'],
        ['dry', 'Cất áo đã khô', 'Put away the dry shirt', 'Khi áo đã khô, gấp lại và cất vào tủ.', 'Once the shirt is dry, fold it and put it away.'],
      ],
      easy: [0, 1, 2], medium: [0, 1, 2], hard: [0, 1, 2],
      extra: ['mud', 'Làm áo dính bùn', 'Get mud on the shirt'],
      extraHint: ['Bùn làm áo bẩn trở lại. Hãy trả hình này về khay.', 'Mud makes the shirt dirty again. Return this picture to the tray.'],
      reward: 'flower', rewardName: ['Bông hoa', 'Flower'],
    },
  ];

  const sun = '<circle cx="148" cy="29" r="15" fill="#ffe18b"/><path d="M148 8v-4m0 50v-4m-21-21h-5m52 0h-5m-36-15l-4-4m37 37l-4-4m-29 0l-4 4m37-37l-4 4" stroke="#efbd54" stroke-width="3"/>';
  const sparkle = '<path d="M144 73v16m-8-8h16m-31 17v10m-5-5h10" stroke="#fff" stroke-width="4"/>';
  const floor = '<path d="M9 113h162v30H9Z" fill="#e8d3b3"/><path d="M9 113h162" stroke="#cba983" stroke-width="3"/>';
  const cloud = '<path d="M28 59q-8-21 13-26q13-28 35-7q21-10 30 10q26 1 22 25Z" fill="#9fbbcf" stroke="#6c90ad" stroke-width="3"/>';
  const rain = '<path d="M42 74l-7 14m28-14l-7 14m29-14l-7 14m28-14l-7 14M49 99l-7 14m29-14l-7 14m29-14l-7 14" stroke="#5caedc" stroke-width="5"/>';
  const branch = '<path d="M13 109q66-17 155-6m-30-5l10-17" stroke="#9a6b45" stroke-width="8" fill="none"/><path d="M145 90q-2-24 18-20q5 18-18 20" fill="#68b35f" stroke="#408846" stroke-width="2"/>';
  const nest = '<path d="M38 87q53 34 105 0l-9 26q-40 20-86-1Z" fill="#c89859" stroke="#996a3c" stroke-width="3"/><path d="M43 96l88 10m-80 5l77-9m-56 16l34-14m-8 19l-29-22" stroke="#9c703f" stroke-width="3"/>';
  const bird = '<ellipse cx="109" cy="62" rx="25" ry="22" fill="#e3af6a" stroke="#b47d42" stroke-width="3"/><circle cx="128" cy="43" r="16" fill="#edbb7c" stroke="#b47d42" stroke-width="3"/><path d="M140 43l14 6-15 5M88 57l-18-8 14 23" fill="#eaa650" stroke="#b47d42" stroke-width="2"/><path d="M95 57q21-4 24 13q-15 10-24-13" fill="#be814e"/><circle cx="131" cy="39" r="3" fill="#4d4b55"/>';
  const leaf = '<path d="M25 106q51-86 112-53q-27 62-112 53Z" fill="#79bc63" stroke="#478d4c" stroke-width="3"/><path d="M34 100l89-43m-59 31l-1-22m20 13l25 7" fill="none" stroke="#478d4c" stroke-width="3"/>';
  const boat = '<path d="M34 83l55-45 45 45Z" fill="#fff4cf" stroke="#c49d52" stroke-width="3"/><path d="M20 77l70 22 70-22-26 40H45Z" fill="#f1c76e" stroke="#c49d52" stroke-width="3"/><path d="M90 99v18M90 44v45" stroke="#d7b367" stroke-width="2"/>';
  const water = '<path d="M8 101q15-8 31 0t31 0t31 0t31 0t40 0v42H8Z" fill="#9edce7"/><path d="M15 121q18-8 36 0m25 10q17-8 34 0m18-13q17-8 30 0" fill="none" stroke="#5fb4cf" stroke-width="3"/>';
  const toyBox = '<path d="M32 77h115l-5 58H37Z" fill="#96c3c6" stroke="#579297" stroke-width="3"/><path d="M32 77l12-13h88l15 13Z" fill="#bbdcdd" stroke="#579297" stroke-width="3"/><rect x="71" y="96" width="36" height="15" rx="6" fill="#d9eff0"/>';
  const ball = '<circle cx="0" cy="0" r="13" fill="#e7af72" stroke="#bc854b" stroke-width="2"/><path d="M-12-3q15-8 24 6M-1-12q-7 13 2 24" stroke="#fff0ce" stroke-width="3" fill="none"/>';
  const block = '<rect x="-12" y="-12" width="24" height="24" rx="4" fill="#b9a4d7" stroke="#8f77b4" stroke-width="2"/><path d="M-6 1l5-5 7 7" stroke="#e9dcfa" stroke-width="3" fill="none"/>';
  const bear = '<circle cx="-9" cy="-15" r="6" fill="#c69d6d"/><circle cx="9" cy="-15" r="6" fill="#c69d6d"/><ellipse cy="10" rx="13" ry="16" fill="#d3ad7d" stroke="#a47f55" stroke-width="2"/><circle cy="-7" r="13" fill="#d3ad7d" stroke="#a47f55" stroke-width="2"/><circle cx="-5" cy="-8" r="2" fill="#514b43"/><circle cx="5" cy="-8" r="2" fill="#514b43"/><ellipse cy="-2" rx="5" ry="4" fill="#edcf9f"/><circle cy="-3" r="2" fill="#514b43"/>';
  const backpack = '<rect x="45" y="61" width="67" height="72" rx="16" fill="#91bbc9" stroke="#5a91a3" stroke-width="3"/><path d="M64 61V48q15-16 30 0v13" fill="none" stroke="#5a91a3" stroke-width="5"/><rect x="57" y="96" width="43" height="27" rx="8" fill="#c0deea" stroke="#5a91a3" stroke-width="2"/><path d="M56 83h45" stroke="#eaf7fb" stroke-width="3"/>';
  const head = '<circle cx="0" cy="0" r="15" fill="#efbd98" stroke="#b27a5f" stroke-width="2"/><path d="M-15-2q-4-23 17-20q18 1 14 19L7-9Q-4 1-15-2" fill="#7e5e48"/><circle cx="-5" cy="1" r="1.8" fill="#514b55"/><circle cx="6" cy="1" r="1.8" fill="#514b55"/><path d="M-3 7q4 4 8 0" stroke="#b27764" stroke-width="2" fill="none"/>';
  const shirt = '<path d="M48 47l26-12q16 12 32 0l26 12-13 24-12-7v58H73V64l-12 7Z" fill="#e6a1b4" stroke="#b96e88" stroke-width="3"/><path d="M75 39q15 21 30 0" fill="none" stroke="#f7d4df" stroke-width="4"/><path d="M81 109h17" stroke="#f7d4df" stroke-width="4"/>';
  const bucket = '<path d="M45 62h74l-9 66H54Z" fill="#e7ae78" stroke="#bb814a" stroke-width="3"/><path d="M50 63q32-45 63 0" stroke="#bb814a" stroke-width="4" fill="none"/><ellipse cx="82" cy="63" rx="37" ry="10" fill="#f1d390" stroke="#bb814a" stroke-width="3"/>';
  const sand = '<path d="M8 110q53-16 164 0v33H8Z" fill="#f2dda5"/><path d="M20 124l13 2m20 9l12-3m69 2l11-3m9-15l8 2" stroke="#d6b674" stroke-width="3"/>';

  const pictures = {
    cake: {
      mix: floor + '<path d="M40 84h97q-2 46-48 46T40 84Z" fill="#9dc9c7" stroke="#5e9c97" stroke-width="3"/><ellipse cx="89" cy="85" rx="48" ry="10" fill="#efcf92" stroke="#5e9c97" stroke-width="3"/><path d="M105 81l21-50" stroke="#ac7c48" stroke-width="8"/><path d="M62 78q23-19 48 0m-20-35q7-8 14 0m-42-5q-5-8 2-12" stroke="#cf9f62" stroke-width="3" fill="none"/><path d="M31 40l-10 19h24Z" fill="#faf0d5" stroke="#d4c6a0" stroke-width="2"/><ellipse cx="54" cy="43" rx="9" ry="12" fill="#f9e3b7" stroke="#c6a878" stroke-width="2"/>',
      bake: floor + '<rect x="30" y="25" width="121" height="111" rx="12" fill="#a9c6cc" stroke="#6e969f" stroke-width="3"/><circle cx="48" cy="41" r="5" fill="#f9df9a"/><circle cx="67" cy="41" r="5" fill="#f9df9a"/><rect x="43" y="58" width="95" height="65" rx="9" fill="#e8f1ee" stroke="#6e969f" stroke-width="3"/><path d="M55 69h70" stroke="#6e969f" stroke-width="5"/><path d="M59 111V95q28-23 55 0v16Z" fill="#dab070" stroke="#b5884c" stroke-width="2"/><path d="M62 114h55" stroke="#819ba0" stroke-width="4"/>',
      decorate: floor + '<ellipse cx="90" cy="131" rx="62" ry="9" fill="#abc8ce"/><path d="M42 84h95v41H42Z" fill="#ddba7e" stroke="#b48b50" stroke-width="3"/><ellipse cx="90" cy="83" rx="48" ry="13" fill="#ffe7ec" stroke="#c78ca1" stroke-width="3"/><path d="M43 84v13q9 14 18 0q9 15 18 0q9 15 18 0q9 15 18 0q10 13 21-1V84" fill="#ffe7ec" stroke="#c78ca1" stroke-width="2"/><path d="M89 76V52" stroke="#8ebec8" stroke-width="7"/><path d="M89 48q-11-12 0-23q11 11 0 23" fill="#f4bd59"/><g fill="#d686a0"><circle cx="61" cy="81" r="4"/><circle cx="117" cy="82" r="4"/><circle cx="102" cy="75" r="4"/></g>' + sparkle,
      shoe: floor + '<path d="M36 86h111q-6 43-55 43T36 86Z" fill="#9dc9c7" stroke="#5e9c97" stroke-width="3"/><path d="M51 52h35l10 18 37 10q10 4 5 14H45V81Z" fill="#bb9cd0" stroke="#8764a0" stroke-width="3"/><path d="M45 94h92m-51-28l13 1m-7 7l14 2" stroke="#eee1f6" stroke-width="4"/>',
    },
    butterfly: {
      caterpillar: leaf + '<g fill="#a3cf77" stroke="#5b9c51" stroke-width="2"><circle cx="51" cy="87" r="11"/><circle cx="67" cy="79" r="12"/><circle cx="84" cy="70" r="12"/><circle cx="104" cy="65" r="15"/></g><path d="M99 50l-4-11m16 12l6-10" stroke="#5b9c51" stroke-width="3"/><circle cx="101" cy="62" r="2" fill="#4d4b55"/><circle cx="111" cy="62" r="2" fill="#4d4b55"/><path d="M103 69q4 4 8-1m-56 28l4 6m11-15l4 6m13-15l4 6" stroke="#5b9c51" stroke-width="2" fill="none"/>',
      chrysalis: '<path d="M18 36q72-18 148 2" stroke="#9a6b45" stroke-width="8" fill="none"/><path d="M86 29v21" stroke="#63954e" stroke-width="3"/><path d="M85 48q-33 30-12 70q22 22 34-10q12-33-22-60Z" fill="#aad185" stroke="#608e4f" stroke-width="3"/><path d="M78 66l23 13m-25 2l29 16m-28 0l22 14" stroke="#80b365" stroke-width="3"/><path d="M132 33q-4-24 18-18q5 19-18 18" fill="#7ab868"/>',
      butterfly: '<path d="M20 128q65-24 143 0" stroke="#9a6b45" stroke-width="6" fill="none"/><path d="M137 42l-5 19q-13 24-7 46l11-7q-7-25 0-33l11-25Z" fill="#badb9a" stroke="#739d57" stroke-width="2"/><path d="M86 72Q50 18 29 49Q18 80 72 88Q26 96 46 122Q74 138 88 95M93 72Q124 18 147 50Q158 83 103 88Q150 98 129 123Q102 136 92 95" fill="#e7aecb" stroke="#b87b9e" stroke-width="3"/><g fill="#f8d797"><circle cx="49" cy="64" r="11"/><circle cx="127" cy="64" r="11"/><circle cx="60" cy="109" r="8"/><circle cx="116" cy="110" r="8"/></g><path d="M89 73v29m-3-29l-8-14m15 14l8-14" stroke="#766284" stroke-width="5"/><circle cx="89" cy="73" r="6" fill="#766284"/>',
      balloon: '<path d="M93 85q-17 23 0 45" stroke="#9a99b5" stroke-width="3" fill="none"/><ellipse cx="91" cy="52" rx="32" ry="38" fill="#d7acd7" stroke="#a880b2" stroke-width="3"/><path d="M85 90l6-8 6 8Z" fill="#a880b2"/><path d="M74 31q-9 7-10 19" stroke="#f7e7f5" stroke-width="5" fill="none"/>',
    },
    bird: {
      nest: branch + nest + bird + '<path d="M150 50l-27 15m5-8l9 7" stroke="#9a6b45" stroke-width="3"/>',
      eggs: branch + '<g fill="#f8e7be" stroke="#bb9a6b" stroke-width="2"><ellipse cx="64" cy="90" rx="11" ry="16"/><ellipse cx="88" cy="87" rx="11" ry="16"/><ellipse cx="112" cy="90" rx="11" ry="16"/></g>' + nest + bird,
      chicks: branch + '<g fill="#f7d576" stroke="#c49b49" stroke-width="2"><circle cx="63" cy="79" r="14"/><circle cx="88" cy="73" r="14"/><circle cx="113" cy="79" r="14"/></g><g fill="#4d4b55"><circle cx="59" cy="75" r="2"/><circle cx="68" cy="75" r="2"/><circle cx="84" cy="70" r="2"/><circle cx="93" cy="70" r="2"/><circle cx="109" cy="75" r="2"/><circle cx="118" cy="75" r="2"/></g><path d="M59 82l5 7 5-7m15-5l5 7 5-7m15 5l5 7 5-7" fill="#e79c56" stroke="#b67636" stroke-width="2"/>' + nest + '<path d="M53 96l6-8 6 8 6-8 5 10m28 0l5-9 6 7 6-7 5 9" fill="#fff0cf" stroke="#c4a578" stroke-width="2"/>',
      kite: '<path d="M92 21l33 33-33 44-33-44Z" fill="#bfa6db" stroke="#9073b5" stroke-width="3"/><path d="M92 21v77M60 54h65" stroke="#e8dcf6" stroke-width="3"/><path d="M92 99q-22 14 1 28t-15 10" fill="none" stroke="#9073b5" stroke-width="3"/><path d="M85 111l-12-7v14Z" fill="#e4b17d"/><path d="M98 128l11-6v13Z" fill="#e4b17d"/>',
    },
    weather: {
      clouds: '<path d="M12 132q31-36 66-10q38-46 91 9v12H12Z" fill="#99c581"/>' + cloud + '<g transform="translate(42 20) scale(.9)">' + cloud + '</g>',
      rain: '<path d="M12 132q31-36 66-10q38-46 91 9v12H12Z" fill="#99c581"/>' + cloud + rain + '<ellipse cx="98" cy="134" rx="38" ry="6" fill="#91d0df"/>',
      rainbow: '<path d="M12 132q31-36 66-10q38-46 91 9v12H12Z" fill="#99c581"/><g fill="none" stroke-width="7"><path d="M29 123a62 62 0 0 1 124 0" stroke="#db8c9e"/><path d="M36 123a55 55 0 0 1 110 0" stroke="#e8b16f"/><path d="M43 123a48 48 0 0 1 96 0" stroke="#efd782"/><path d="M50 123a41 41 0 0 1 82 0" stroke="#90bc82"/><path d="M57 123a34 34 0 0 1 68 0" stroke="#8cbace"/><path d="M64 123a27 27 0 0 1 54 0" stroke="#bba1d2"/></g>' + sun + '<g transform="translate(-7 27) scale(.48)">' + cloud + '</g><path d="M23 66l-4 8m15-8l-4 8" stroke="#5caedc" stroke-width="3"/>',
      lamp: floor + '<path d="M86 69v57m-22 3h47" stroke="#6c999d" stroke-width="7"/><path d="M62 28h48l18 43H44Z" fill="#f1d387" stroke="#c3a260" stroke-width="3"/><path d="M57 83l-8 9m29-8v11m27-12l8 9" stroke="#ead690" stroke-width="3"/>',
    },
    'paper-boat': {
      fold: floor + '<path d="M37 46h104v59H37Z" fill="#fff4cf" stroke="#c49d52" stroke-width="3"/><path d="M37 46l52 40 52-40" fill="#f0cd7f" stroke="#c49d52" stroke-width="3"/><path d="M90 86v19" stroke="#c49d52" stroke-width="2" stroke-dasharray="4 4"/><path d="M12 67l24-8 17 16q4 6-3 8l-13-10-13 10-10-1Z" fill="#efbd98" stroke="#b27a5f" stroke-width="2"/><path d="M168 67l-24-8-17 16q-4 6 3 8l13-10 13 10 10-1Z" fill="#efbd98" stroke="#b27a5f" stroke-width="2"/>',
      boat: floor + boat,
      float: water + '<g transform="translate(0 -8)">' + boat + '</g><path d="M15 42q21 6 33-5m-24 15q15 5 24-1" stroke="#a5cdd4" stroke-width="3" fill="none"/>',
      stone: water + '<path d="M70 62q18-15 33-3l9 20-16 14-24-6Z" fill="#a5adb3" stroke="#788891" stroke-width="3"/><path d="M77 110q16-9 31 0m-39 9q22-10 45 0" stroke="#5fb4cf" stroke-width="3" fill="none"/>',
    },
    toys: {
      scattered: floor + '<g transform="translate(35 121)">' + ball + '</g><g transform="translate(92 123) rotate(16)">' + block + '</g><g transform="translate(135 105) rotate(-18)">' + bear + '</g><path d="M31 44h121" stroke="#d6c4aa" stroke-width="3"/><path d="M44 44v20m95-20v20" stroke="#d6c4aa" stroke-width="3"/>',
      sort: floor + '<g transform="translate(29 127)">' + ball + '</g><g transform="translate(112 74)">' + bear + '</g>' + toyBox + '<g transform="translate(74 48)">' + block + '</g><path d="M147 30l-34 4-12 13q-8 4-6 10q5 5 13-2l13-8 28 4Z" fill="#efbd98" stroke="#b27a5f" stroke-width="3"/>',
      tidy: floor + '<g transform="translate(0 -13)">' + toyBox + '</g><path d="M34 64h111l-9-10H44Z" fill="#bddcdd" stroke="#579297" stroke-width="3"/>' + sparkle + '<path d="M30 129h15m20 0h28m16 0h15" stroke="#cfb68e" stroke-width="3"/>',
      paint: floor + '<path d="M28 118q18-24 49-7q40-14 60 11q-43 29-109-4Z" fill="#c9a0d5"/><g transform="rotate(20 89 73)"><rect x="62" y="46" width="54" height="60" rx="5" fill="#d7c8e1" stroke="#9478aa" stroke-width="3"/><path d="M67 46q22-32 44 0" fill="none" stroke="#9478aa" stroke-width="3"/><ellipse cx="89" cy="47" rx="26" ry="7" fill="#b08cc4"/></g>',
    },
    school: {
      pack: floor + backpack + '<path d="M78 28h38v53H78Z" fill="#dfb973" stroke="#bb9657" stroke-width="3"/><path d="M81 31h30v7H81Z" fill="#fff1cd"/><path d="M104 18l-17 15q-6 6-1 11l15-9 17 4 33-11-7-19Z" fill="#efbd98" stroke="#b27a5f" stroke-width="3"/>',
      walk: '<path d="M8 123q82-21 164 0v20H8Z" fill="#9fc48b"/><path d="M61 139q22-14 39-30" stroke="#e6d3b3" stroke-width="18" fill="none"/><path d="M102 66h58v55h-58Z" fill="#edd094" stroke="#be9f67" stroke-width="2"/><path d="M96 67l35-27 35 27Z" fill="#bca6ca" stroke="#9078a2" stroke-width="2"/><rect x="122" y="92" width="18" height="29" rx="2" fill="#a2c3cf"/><rect x="110" y="76" width="13" height="11" rx="2" fill="#c8e5e8"/><rect x="140" y="76" width="13" height="11" rx="2" fill="#c8e5e8"/><g transform="translate(45 70)">' + head + '<path d="M-12 18h25l4 29h-32Z" fill="#e3b96d" stroke="#b58d48" stroke-width="2"/><path d="M-7 48l-9 17m24-17l9 17" stroke="#7195a8" stroke-width="7"/><path d="M-11 25l-15 13m39-13l12 12" stroke="#efbd98" stroke-width="7"/><rect x="-25" y="15" width="17" height="29" rx="6" fill="#91bbc9" stroke="#5a91a3" stroke-width="2"/></g>',
      class: floor + '<rect x="105" y="23" width="50" height="48" rx="4" fill="#91b6a0" stroke="#628d73" stroke-width="3"/><g transform="translate(65 59)">' + head + '<path d="M-13 18h26l4 28h-34Z" fill="#e3b96d" stroke="#b58d48" stroke-width="2"/></g><path d="M35 111v25m105-25v25" stroke="#b48c60" stroke-width="5"/><rect x="22" y="98" width="135" height="13" rx="5" fill="#d9b383" stroke="#b48c60" stroke-width="2"/><path d="M52 91q17-10 32 0q17-10 32 0v14q-17-9-32 0q-17-9-32 0Z" fill="#fff0cd" stroke="#c3a376" stroke-width="2"/><path d="M84 91v13" stroke="#c3a376" stroke-width="2"/>',
      bed: floor + '<path d="M23 72v61m135-42v42" stroke="#af8c66" stroke-width="6"/><rect x="24" y="90" width="133" height="27" rx="5" fill="#b9adce" stroke="#927faf" stroke-width="3"/><rect x="32" y="82" width="42" height="19" rx="8" fill="#f3e5dc"/><g transform="translate(56 80) scale(.8)">' + head + '</g><path d="M74 82h65q15 2 15 19H74Z" fill="#b9adce" stroke="#927faf" stroke-width="3"/>',
    },
    sandcastle: {
      fill: sand + bucket + '<path d="M112 27l31 35" stroke="#739d93" stroke-width="8"/><path d="M132 56l17 15-11 23q-12 9-24-2Z" fill="#97c2b5" stroke="#5e9787" stroke-width="3"/><path d="M101 45l-7 18m13-12l-3 12" stroke="#d0ad65" stroke-width="4"/><path d="M133 69q-8 1-13 17l15-1 6-12Z" fill="#e9cd8e"/>',
      turn: sand + '<g transform="translate(168 173) rotate(180)">' + bucket + '</g><path d="M128 45q22 19 9 43m12-7l-12 7-5-13" stroke="#7899a0" stroke-width="3" fill="none"/>',
      castle: sand + '<path d="M42 111V82h10V69h12v13h13V69h12v13h13V69h12v13h10v29Z" fill="#e4c78b" stroke="#bc9e5d" stroke-width="3"/><path d="M73 111V95q13-17 25 0v16" fill="#c7a567" stroke="#bc9e5d" stroke-width="2"/><path d="M88 67V37l24 11-24 11" fill="#d99db5" stroke="#b86f8e" stroke-width="3"/><g transform="translate(91 4) scale(.48)">' + bucket + '</g><path d="M136 93V76m-6 6l6-6 6 6" stroke="#7899a0" stroke-width="3" fill="none"/>',
      leaves: sand + bucket + '<path d="M65 62q-22-30-1-36q17 14 1 36m16 1q-4-39 16-33q7 20-16 33m13-1q12-31 29-19q0 20-29 19" fill="#7ab568" stroke="#4c8d4c" stroke-width="2"/>',
    },
    laundry: {
      wash: floor + '<rect x="30" y="20" width="123" height="114" rx="11" fill="#b3cdd3" stroke="#7399a6" stroke-width="3"/><rect x="43" y="29" width="34" height="12" rx="3" fill="#edf5f3"/><circle cx="135" cy="36" r="6" fill="#f2d590"/><circle cx="91" cy="88" r="36" fill="#d9edf0" stroke="#7399a6" stroke-width="5"/><g transform="translate(44 55) scale(.52)">' + shirt + '</g><g fill="#f5fcff" stroke="#9bcdd9" stroke-width="2"><circle cx="72" cy="97" r="8"/><circle cx="113" cy="90" r="7"/><circle cx="101" cy="109" r="6"/></g>',
      hang: sun + '<path d="M16 40v99m148-99v99M16 44q74 11 148 0" stroke="#a3aba3" stroke-width="4"/><g transform="translate(0 8)">' + shirt + '</g><path d="M72 42v12m33-12v12" stroke="#ba995f" stroke-width="5"/><path d="M71 136l-3 6m18-9l-3 7m24-6l-3 7" stroke="#65b4d0" stroke-width="4"/>',
      dry: floor + '<rect x="35" y="29" width="111" height="105" rx="8" fill="#e4caa0" stroke="#bc9a6e" stroke-width="3"/><rect x="47" y="39" width="86" height="82" rx="4" fill="#f4e4c8"/><path d="M48 82h85" stroke="#bc9a6e" stroke-width="4"/><path d="M59 100h63v16H59Z" fill="#e6a1b4" stroke="#b96e88" stroke-width="2"/><path d="M65 87h52v15H65Z" fill="#efbdcc" stroke="#b96e88" stroke-width="2"/><path d="M78 88q11 9 24 0m-35 25h44" stroke="#f9e2e9" stroke-width="3"/>' + sparkle,
      mud: '<path d="M12 130q12-21 44-7q30-16 53 1q31-12 59 10v9H12Z" fill="#a47a56"/>' + shirt + '<g fill="#916444"><ellipse cx="82" cy="80" rx="10" ry="8"/><circle cx="101" cy="92" r="7"/><circle cx="93" cy="64" r="4"/><circle cx="62" cy="57" r="4"/></g>',
    },
  };

  function illustration(storyId, stepId) {
    if (!Object.prototype.hasOwnProperty.call(pictures, storyId)) return '';
    const drawing = pictures[storyId][stepId];
    if (typeof drawing !== 'string') return '';
    const background = ['butterfly', 'bird', 'weather', 'sandcastle'].includes(storyId)
      ? '#f2f9e7' : '#eff9fb';
    return `<svg class="sgr-picture" viewBox="0 0 180 150" aria-hidden="true" focusable="false"><rect x="2" y="2" width="176" height="146" rx="20" fill="${background}"/><g stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
  }

  global.StoryScenes = { stories, illustration };
})(window);
