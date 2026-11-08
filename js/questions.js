(function (global) {
  global.PLAYER_AVATARS = [
    { id: "bike", icon: "🚲", title: "Cán bộ Kế hoạch" },
    { id: "rice", icon: "🌾", title: "Xã viên Khoán 10" },
    { id: "gear", icon: "⚙️", title: "Kỹ sư Công nghiệp" },
    { id: "ship", icon: "🚢", title: "Sứ giả Hội nhập" },
    { id: "book", icon: "📚", title: "Trí thức Khoa học" },
    { id: "radio", icon: "📻", title: "Phóng viên Thời cuộc" }
  ];

  global.STRATEGIES = {
    safe: {
      id: "safe",
      icon: "🛡️",
      name: "Thận trọng",
      winMult: 1.0,
      loseRate: 0,
      loseCap: 0
    },
    balanced: {
      id: "balanced",
      icon: "⚖️",
      name: "Vững chắc",
      winMult: 1.5,
      loseRate: 0.10,
      loseCap: 350
    },
    bold: {
      id: "bold",
      icon: "🔥",
      name: "Đột phá",
      winMult: 2.2,
      loseRate: 0.25,
      loseCap: 900
    }
  };

  global.LOBBY_TRIVIA = [
    "📰 Năm 1986, lạm phát từng lên tới đỉnh điểm 774,7% trước thềm Đại hội VI.",
    "🌾 Chỉ 1 năm sau Khoán 10 (4/1988), năm 1989 Việt Nam đã bắt đầu xuất khẩu gạo.",
    "🤝 Tháng 7/1995: Bình thường hóa quan hệ Việt – Mỹ (11/7) và gia nhập ASEAN (28/7).",
    "📈 Giai đoạn 1991–1995, GDP tăng bình quân 8,2%/năm, đưa đất nước ra khỏi khủng hoảng.",
    "🏛️ Đại hội IX (2001) xác định Kinh tế thị trường định hướng XHCN là mô hình kinh tế tổng quát."
  ];

  global.DEFAULT_QUESTIONS = [
    {
      id: "q1",
      expressInclude: true,
      eraBadge: "1982 – 1986 · ĐẠI HỘI V",
      yearLabel: "3/1982",
      macro: { inflation: "195%", gdpStatus: "Khủng hoảng & Cấm vận", mechanism: "Bao cấp tem phiếu" },
      event: null,
      scenario: "Tháng 3/1982, đất nước bị bao vây cấm vận và khủng hoảng KT-XH. Đại hội V xác định nước ta ở 'chặng đường đầu tiên' của thời kỳ quá độ với 2 nhiệm vụ chiến lược.",
      question: "Đại hội V (3/1982) xác định lĩnh vực nào là 'MẶT TRẬN HÀNG ĐẦU'?",
      options: [
        "Công nghiệp nặng luyện kim và chế tạo máy",
        "Nông nghiệp (giải quyết lương thực, thực phẩm)",
        "Tài chính – tiền tệ và chứng khoán quốc tế",
        "Khai thác dầu khí và thương mại điện tử"
      ],
      correctIndex: 1,
      mcNote: "Đại hội V (27–31/3/1982, TBT Lê Duẩn) xác định 2 nhiệm vụ chiến lược (xây dựng CNXH & bảo vệ Tổ quốc) và coi Nông nghiệp là mặt trận hàng đầu."
    },
    {
      id: "q2",
      expressInclude: false,
      eraBadge: "1982 – 1986 · CÁC BƯỚC ĐỘT PHÁ",
      yearLabel: "1985–1986",
      macro: { inflation: "774,7%", gdpStatus: "Bão giá - lương - tiền", mechanism: "Phá băng bao cấp" },
      event: {
        type: "inflation_1985",
        tone: "storm",
        badge: "🌪️ BIẾN CỐ NĂM 1985: CÚ SỐC ĐỔI TIỀN & BÃO GIÁ!",
        desc: "Đúng +250 Vốn bình ổn · Sai mất thêm 15% vốn (trừ khi chọn 🛡️ Thận trọng)"
      },
      scenario: "Sau TW 8 (6/1985) quyết xóa bao cấp về giá – lương – tiền nhưng gặp sai lầm khi đổi tiền, tháng 7/1986 TBT Lê Duẩn mất, đ/c Trường Chinh làm Tổng Bí thư.",
      question: "Tháng 8/1986, Kết luận của Bộ Chính trị tạo bước đột phá thứ ba xoay quanh 3 nội dung nào?",
      options: [
        "Cơ cấu sản xuất – Cải tạo xã hội chủ nghĩa – Cơ chế quản lý",
        "Đổi tiền lần hai – Cấp thêm tem phiếu – Đóng cửa mậu dịch",
        "Tư nhân hóa đất đai – Xóa bỏ hợp tác xã – Mở sàn giao dịch vàng",
        "Công nghiệp hóa cấp tốc – Thuế lũy tiến – Bỏ kinh tế hộ gia đình"
      ],
      correctIndex: 0,
      mcNote: "Kết luận Bộ Chính trị (8/1986) đột phá vào 3 nội dung: Cơ cấu sản xuất, Cải tạo XHCN và Cơ chế quản lý — định hình trực tiếp đường lối Đại hội VI."
    },
    {
      id: "q3",
      expressInclude: true,
      eraBadge: "12/1986 · ĐẠI HỘI VI – ĐỔI MỚI TOÀN DIỆN",
      yearLabel: "12/1986",
      macro: { inflation: "774,7%", gdpStatus: "Bước ngoặt lịch sử", mechanism: "Đổi mới tư duy kinh tế" },
      event: null,
      scenario: "Cuối năm 1986, lạm phát lên tới 774%, Liên Xô cải tổ. Đại hội VI bầu đ/c Nguyễn Văn Linh làm Tổng Bí thư với tinh thần 'Nhìn thẳng vào sự thật, đánh giá đúng sự thật, nói rõ sự thật'.",
      question: "Trong 4 bài học lớn của Đại hội VI và trọng tâm kinh tế, tổ hợp nào ĐÚNG NHẤT?",
      options: [
        "Mở đầu bằng 'Ưu tiên công nghiệp nặng' & chỉ giữ kinh tế quốc doanh",
        "Mở đầu bằng 'Đấu tranh giai cấp' & duy trì cơ chế tập trung bao cấp",
        "Mở đầu bằng 'Lấy dân làm gốc' & thực hiện Ba chương trình kinh tế lớn",
        "Mở đầu bằng 'Hội nhập WTO' & xóa bỏ hoàn toàn kinh tế nhà nước"
      ],
      correctIndex: 2,
      mcNote: "Đại hội VI mở đầu 4 bài học bằng 'Lấy dân làm gốc', phát triển nhiều thành phần kinh tế, xóa cơ chế bao cấp và triển khai 3 chương trình kinh tế lớn."
    },
    {
      id: "q4",
      expressInclude: false,
      eraBadge: "12/1986 · ĐẠI HỘI VI – KINH TẾ",
      yearLabel: "12/1986",
      macro: { inflation: "390%", gdpStatus: "Khơi thông sản xuất", mechanism: "Kinh tế nhiều thành phần" },
      event: null,
      scenario: "Đổi mới tư duy – trước hết là tư duy kinh tế, Đại hội VI quyết định tập trung nguồn lực cho 'Ba chương trình kinh tế lớn'.",
      question: "'Ba chương trình kinh tế lớn' do Đại hội VI đề ra bao gồm những gì?",
      options: [
        "Điện khí hóa – Luyện kim thép – Chế tạo cơ khí nặng",
        "Lương thực thực phẩm – Hàng tiêu dùng – Hàng xuất khẩu",
        "Hạ tầng cao tốc – Viễn thông số – Tài chính ngân hàng",
        "Khai khoáng mỏ – Đóng tàu biển – Du lịch quốc tế"
      ],
      correctIndex: 1,
      mcNote: "Ba chương trình kinh tế lớn gồm: Lương thực – thực phẩm, Hàng tiêu dùng và Hàng xuất khẩu."
    },
    {
      id: "q5",
      expressInclude: true,
      eraBadge: "1987 – 1991 · THỰC HIỆN ĐỔI MỚI",
      yearLabel: "1988–1989",
      macro: { inflation: "67%", gdpStatus: "Xuất khẩu gạo!", mechanism: "Khoán 10 & Xóa tem phiếu" },
      event: {
        type: "khoan_10_1988",
        tone: "boom",
        badge: "🌾 KỲ TÍCH KHOÁN 10: XUẤT KHẨU GẠO!",
        desc: "Nếu ≥ 60% lớp trả lời đúng, tất cả người chọn đúng được thưởng thêm +350 Vốn!"
      },
      scenario: "Sau chủ trương 'Bốn giảm' (TW 2, 4/1987) và Luật Đầu tư nước ngoài, tháng 4/1988 Bộ Chính trị ban hành Khoán 10 và xóa bỏ chế độ tem phiếu.",
      question: "Nhờ sức bật từ Khoán 10 và xóa bỏ tem phiếu, kỳ tích kinh tế nào xuất hiện ngay năm 1989?",
      options: [
        "Việt Nam hoàn thành công nghiệp hóa trước thời hạn 10 năm",
        "Thu nhập bình quân đầu người vượt mốc 5.000 USD/năm",
        "Lạm phát giảm ngay về 0% trong suốt thập niên 1990",
        "Từ thiếu ăn triền miên, Việt Nam tự túc lương thực và bắt đầu xuất khẩu gạo"
      ],
      correctIndex: 3,
      mcNote: "Khoán 10 (4/1988) trao quyền tự chủ cho hộ nông dân; ngay năm 1989 nước ta bỏ tem phiếu và bắt đầu xuất khẩu gạo."
    },
    {
      id: "q6",
      expressInclude: false,
      eraBadge: "1987 – 1991 · CHÍNH TRỊ & ĐỐI NGOẠI",
      yearLabel: "1988–1990",
      macro: { inflation: "67%", gdpStatus: "Ổn định chính trị", mechanism: "Thêm bạn, bớt thù" },
      event: null,
      scenario: "Giai đoạn 1988–1991: Trung Quốc chiếm Gạc Ma (3/1988), Đông Âu và Liên Xô khủng hoảng rồi sụp đổ. Tháng 9/1989 ta rút hết quân khỏi Campuchia với chủ trương 'thêm bạn, bớt thù'.",
      question: "Về chính trị, Hội nghị Trung ương 6 khóa VI (3/1989) ghi dấu ấn quan trọng nào?",
      options: [
        "Lần đầu dùng khái niệm 'Hệ thống chính trị' và nêu 6 nguyên tắc đổi mới",
        "Chấp nhận cơ chế đa nguyên chính trị và đa đảng đối lập",
        "Tạm hoãn đổi mới kinh tế để quay về cơ chế kế hoạch hóa bao cấp",
        "Ban hành Cương lĩnh xây dựng đất nước năm 1991"
      ],
      correctIndex: 0,
      mcNote: "TW 6 (3/1989) lần đầu dùng khái niệm 'Hệ thống chính trị' và nêu 6 nguyên tắc đổi mới; TW 8 (3/1990) phân tích nguyên nhân khủng hoảng ở Liên Xô."
    },
    {
      id: "q7",
      expressInclude: true,
      eraBadge: "6/1991 · ĐẠI HỘI VII & CƯƠNG LĨNH 1991",
      yearLabel: "6/1991",
      macro: { inflation: "67%", gdpStatus: "Mục tiêu GDP x2 năm 2000", mechanism: "Cương lĩnh 1991" },
      event: null,
      scenario: "Đại hội VII (6/1991, TBT Đỗ Mười) thông qua Cương lĩnh 1991 (5 bài học, 6 đặc trưng, 7 phương hướng) và Chiến lược đến năm 2000 (GDP năm 2000 gấp đôi năm 1990, mục tiêu 'dân giàu, nước mạnh').",
      question: "Điểm mới lịch sử LẦN ĐẦU TIÊN được Đại hội VII khẳng định về nền tảng tư tưởng của Đảng là gì?",
      options: [
        "Lấy lý thuyết bàn tay vô hình của kinh tế thị trường tự do làm nền tảng",
        "Chỉ xác định kinh tế đối ngoại là kim chỉ nam duy nhất cho hành động",
        "Cùng với chủ nghĩa Mác – Lênin, khẳng định Tư tưởng Hồ Chí Minh là nền tảng tư tưởng",
        "Thay thế mục tiêu CNXH bằng mô hình nhà nước phúc lợi Bắc Âu"
      ],
      correctIndex: 2,
      mcNote: "Đại hội VII (6/1991) lần đầu tiên xác định Chủ nghĩa Mác – Lênin và Tư tưởng Hồ Chí Minh là nền tảng tư tưởng, kim chỉ nam cho hành động của Đảng."
    },
    {
      id: "q8",
      expressInclude: false,
      eraBadge: "1991 – 1996 · XÂY DỰNG ĐẢNG & NHÀ NƯỚC",
      yearLabel: "1992–1994",
      macro: { inflation: "14,4%", gdpStatus: "Đà tăng trưởng mạnh", mechanism: "Nhà nước pháp quyền" },
      event: null,
      scenario: "Sau TW 3 (6/1992) nêu 'tự đổi mới, tự chỉnh đốn Đảng', Hội nghị giữa nhiệm kỳ (1/1994) lần đầu đề cập 'Nhà nước pháp quyền' và chỉ rõ các nguy cơ lớn.",
      question: "Đâu là ĐÚNG '4 nguy cơ' mà Hội nghị giữa nhiệm kỳ (1/1994) đã nêu ra?",
      options: [
        "Thiếu lương thực – Lạm phát ba con số – Cấm vận kinh tế – Xung đột biên giới",
        "Nhập siêu thương mại – Thất nghiệp đô thị – Nợ nước ngoài – Biến đổi khí hậu",
        "Già hóa dân số – Chảy máu chất xám – Ô nhiễm môi trường – Khủng hoảng dầu mỏ",
        "Tụt hậu xa hơn về kinh tế – Chệch hướng XHCN – Tham nhũng & quan liêu – 'Diễn biến hòa bình'"
      ],
      correctIndex: 3,
      mcNote: "Hội nghị giữa nhiệm kỳ (1/1994) chỉ rõ 4 nguy cơ: Tụt hậu xa hơn về kinh tế, Chệch hướng XHCN, Nạn tham nhũng & quan liêu, và 'Diễn biến hòa bình'."
    },
    {
      id: "q9",
      expressInclude: true,
      eraBadge: "1991 – 1996 · RA KHỎI KHỦNG HOẢNG",
      yearLabel: "1991–1995",
      macro: { inflation: "12,7%", gdpStatus: "GDP +8,2%/năm · Thoát khủng hoảng", mechanism: "Đa phương hóa – Hội nhập" },
      event: {
        type: "asean_fdi_1995",
        tone: "boom",
        badge: "🌏 MỞ CỬA HỘI NHẬP 1995: ĐÓN SÓNG ĐẦU TƯ!",
        desc: "Nửa dưới BXH trả lời đúng nhận +450 Vốn · Nửa trên nhận +200 Vốn"
      },
      scenario: "Giai đoạn 1991–1995, GDP tăng 8,2%/năm, lạm phát giảm còn 12,7%, đất nước ra khỏi khủng hoảng cùng các mốc đối ngoại đa dạng hóa, đa phương hóa.",
      question: "Trình tự thời gian CHÍNH XÁC của 4 cột mốc đối ngoại giai đoạn 1991–1995 là gì?",
      options: [
        "Bình thường hóa TQ (11/1991) → Mỹ bỏ cấm vận (2/1994) → Ngoại giao VN–Mỹ (11/7/1995) → Gia nhập ASEAN (28/7/1995)",
        "Gia nhập ASEAN (1991) → Mỹ bỏ cấm vận (1992) → Bình thường hóa TQ (1994) → Ngoại giao VN–Mỹ (1995)",
        "Mỹ bỏ cấm vận (1991) → Ngoại giao VN–Mỹ (1993) → Gia nhập ASEAN (1994) → Bình thường hóa TQ (1995)",
        "Bình thường hóa TQ (1991) → Gia nhập ASEAN (1993) → Ngoại giao VN–Mỹ (1994) → Mỹ bỏ cấm vận (1995)"
      ],
      correctIndex: 0,
      mcNote: "Các mốc đối ngoại: Bình thường hóa với Trung Quốc (11/1991) → Mỹ bỏ cấm vận (3/2/1994) → Quan hệ ngoại giao VN–Mỹ (11/7/1995) → Gia nhập ASEAN (28/7/1995)."
    },
    {
      id: "q10",
      expressInclude: true,
      eraBadge: "1996 – 2001 · ĐẠI HỘI VIII",
      yearLabel: "1996–1998",
      macro: { inflation: "9,2%", gdpStatus: "Vượt bão tài chính châu Á", mechanism: "Đẩy mạnh CNH, HĐH" },
      event: {
        type: "asian_crisis_1997",
        tone: "storm",
        badge: "📉 KHỦNG HOẢNG TÀI CHÍNH CHÂU Á 1997!",
        desc: "Top 5 dẫn điểm trả lời sai bị trừ thêm 15% vốn · Trả lời đúng +250 Vốn"
      },
      scenario: "Đại hội VIII (1996) tổng kết 10 năm Đổi mới: đất nước ra khỏi khủng hoảng, chuyển sang đẩy mạnh CNH, HĐH (12/1997 đ/c Lê Khả Phiêu làm TBT, vượt qua khủng hoảng tài chính châu Á).",
      question: "Hai Nghị quyết Trung ương nổi bật khóa VIII về Quốc sách và Văn hóa khẳng định điều gì?",
      options: [
        "TW 2 xóa chế độ tem phiếu; TW 5 ban hành cơ chế Khoán 10 trong nông nghiệp",
        "TW 2 coi GD-ĐT & KH-CN là quốc sách hàng đầu; TW 5 (7/1998) xây dựng văn hóa 'tiên tiến, đậm đà bản sắc dân tộc'",
        "TW 2 thông qua Cương lĩnh 1991; TW 5 xác định gia nhập Liên minh châu Âu",
        "TW 2 đổi tiền toàn quốc; TW 5 coi khai thác tài nguyên thô là quốc sách số một"
      ],
      correctIndex: 1,
      mcNote: "Đại hội VIII nêu 6 bài học & 6 quan điểm CNH; TW 2 (12/1996) coi GD-ĐT và KH-CN là quốc sách hàng đầu; TW 5 (7/1998) xây dựng văn hóa 'tiên tiến, đậm đà bản sắc dân tộc'."
    },
    {
      id: "q11",
      expressInclude: true,
      eraBadge: "2001 – 2006 · ĐẠI HỘI IX",
      yearLabel: "2001–2003",
      macro: { inflation: "6,8%", gdpStatus: "Hướng tới nước công nghiệp", mechanism: "KTTT định hướng XHCN" },
      event: null,
      scenario: "Đại hội IX (2001, TBT Nông Đức Mạnh) đề ra Chiến lược 2001–2010 (đến 2020 cơ bản thành nước công nghiệp), làm rõ 'bỏ qua chế độ TBCN', cùng các NQ về kinh tế tư nhân (TW 5), đất đai – đại đoàn kết (TW 7), bảo vệ Tổ quốc (TW 8).",
      question: "Đại hội IX chính thức xác định 'MÔ HÌNH KINH TẾ TỔNG QUÁT' của nước ta trong thời kỳ quá độ là gì?",
      options: [
        "Kinh tế hàng hóa nhỏ tự cung tự cấp có quản lý",
        "Kinh tế kế hoạch hóa tập trung phi thị trường",
        "Kinh tế thị trường định hướng xã hội chủ nghĩa",
        "Kinh tế thị trường tự do tư bản chủ nghĩa hoàn toàn"
      ],
      correctIndex: 2,
      mcNote: "Đại hội IX (2001) xác định Kinh tế thị trường định hướng xã hội chủ nghĩa là mô hình kinh tế tổng quát của nước ta trong thời kỳ quá độ."
    },
    {
      id: "q12",
      expressInclude: true,
      eraBadge: "CHUNG KẾT · VẬN DỤNG THỰC TIỄN",
      yearLabel: "2006 → NAY",
      macro: { inflation: "<4%", gdpStatus: "Hội nhập & Phát triển", mechanism: "Độc lập tự chủ & Hội nhập sâu" },
      event: {
        type: "finale_x2_2006",
        tone: "boom",
        badge: "🏆 VÒNG CHUNG KẾT: NHÂN ĐÔI ĐIỂM (X2)!",
        desc: "Điểm cơ bản và điểm tốc độ được nhân đôi ở câu cuối cùng!"
      },
      scenario: "Nhìn lại chặng đường 1982–2006 từ vượt khủng hoảng kinh tế – xã hội, phá thế bao vây cấm vận đến đẩy mạnh CNH, HĐH và hội nhập quốc tế.",
      question: "Định hướng nào kết tinh ĐÚNG NHẤT bài học Đổi mới khi vận dụng vào phát triển đất nước hiện nay?",
      options: [
        "Đóng cửa tự cung tự cấp để tránh hoàn toàn biến động chuỗi cung ứng toàn cầu",
        "Tăng trưởng GDP bằng mọi giá, xem nhẹ văn hóa, môi trường và Nhà nước pháp quyền",
        "Sao chép nguyên bản mô hình nước ngoài mà không cần xuất phát từ thực tiễn Việt Nam",
        "Lấy dân làm gốc, phát triển KTTT định hướng XHCN dựa trên KH-CN, giữ vững độc lập tự chủ và bản sắc văn hóa khi hội nhập"
      ],
      correctIndex: 3,
      mcNote: "Bài học xuyên suốt: Lấy dân làm gốc, phát triển KTTT định hướng XHCN gắn với KH-CN, kết hợp sức mạnh dân tộc với thời đại, giữ vững độc lập tự chủ và bản sắc văn hóa."
    }
  ];

  global.BOT_NAMES = [
    "Minh Anh", "Hoàng Nam", "Thu Hà", "Quốc Bảo", "Phương Thảo",
    "Đức Duy", "Ngọc Ánh", "Tuấn Kiệt", "Khánh Linh", "Gia Huy",
    "Thanh Trúc", "Văn Hùng", "Bảo Ngọc", "Anh Quân", "Thảo Vy",
    "Hải Đăng", "Mai Phương", "Đình Phúc", "Yến Nhi", "Trọng Nghĩa",
    "Hồng Nhung", "Quang Minh", "Lan Hương", "Thành Đạt", "Diệu Linh",
    "Trung Kiên", "Thùy Dương", "Nhật Minh", "Bích Ngọc", "Tuấn Khôi",
    "Hà My", "Việt Hoàng", "Kim Ngân", "Xuân Bách", "Tuyết Mai",
    "Minh Triết", "Quỳnh Trang", "Đức Thịnh", "Ngọc Hân", "Hữu Phước",
    "Thu Thủy", "Hoàng Long", "Cẩm Tú", "Mạnh Dũng", "Bảo Châu"
  ];
})(window);
