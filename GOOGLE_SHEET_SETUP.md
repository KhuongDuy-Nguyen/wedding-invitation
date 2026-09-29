# HƯỚNG DẪN KẾT NỐI LỜI CHÚC & RSVP VÀO GOOGLE SHEETS

Dữ liệu lời chúc và xác nhận tham dự của khách sẽ tự động được gửi và lưu trữ an toàn vào Google Sheets của bạn. Hãy làm theo 4 bước đơn giản dưới đây (chỉ mất ~2 phút):

---

### Bước 1: Tạo một Google Sheet mới
1. Mở trình duyệt và truy cập [Google Sheets](https://sheets.new) để tạo một bảng tính mới.
2. Đổi tên bảng tính thành: **"Sổ lưu bút đám cưới Duy & Lan"**.
3. Tại dòng đầu tiên (Hàng 1), tạo 4 cột tiêu đề sau:
   - Cột A: **Thời gian**
   - Cột B: **Họ và tên**
   - Cột C: **Khách của ai**
   - Cột D: **Lời chúc**

---

### Bước 2: Dán mã Google Apps Script
1. Trên thanh menu của Google Sheets, chọn: **Tiện ích mở rộng** (Extensions) > **Apps Script**.
2. Xoá hết mã mặc định trong khung soạn thảo `Code.gs` và dán toàn bộ đoạn code dưới đây vào:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data;
    
    // Hỗ trợ cả dữ liệu dạng JSON và Form Data
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }

    var timestamp = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
    var name = data.name || "Khách mời";
    var relation = data.relation || "Bạn chung";
    var message = data.message || "";

    // Thêm dòng mới vào Google Sheets (4 cột)
    sheet.appendRow([timestamp, name, relation, message]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã lưu lời chúc thành công!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    var wishes = [];

    // Lấy danh sách các lời chúc gần nhất (bỏ qua hàng tiêu đề)
    for (var i = rows.length - 1; i >= 1; i--) {
      // Hỗ trợ cấu trúc 4 cột mới (lời chúc ở cột D - index 3) hoặc 6 cột cũ (cột F - index 5)
      var message = rows[i][3] || rows[i][5] || "";
      if (rows[i][1] || message) {
        wishes.push({
          date: rows[i][0],
          name: rows[i][1],
          relation: rows[i][2],
          message: message
        });
      }
      if (wishes.length >= 50) break; // Lấy tối đa 50 lời chúc mới nhất
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      wishes: wishes
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Bấm biểu tượng **Lưu** (Save / hình đĩa mềm).

---

### Bước 3: Triển khai (Deploy) làm Web App
1. Ở góc trên bên phải màn hình Apps Script, bấm nút xanh **Triển khai (Deploy)** > chọn **Tùy chọn triển khai mới (New deployment)**.
2. Bấm vào biểu tượng bánh răng ⚙️ cạnh chữ *Chọn loại*, chọn **Ứng dụng web (Web app)**.
3. Điền thông tin như sau:
   - **Mô tả**: Nhận lời chúc cưới Duy & Lan
   - **Thực thi dưới dạng (Execute as)**: **Tôi (email của bạn)**
   - **Ai có quyền truy cập (Who has access)**: **Bất kỳ ai (Anyone)** *(Rất quan trọng để khách không cần đăng nhập Google vẫn gửi được)*
4. Bấm **Triển khai (Deploy)**.
   *(Nếu Google hỏi xác thực quyền truy cập "Cấp quyền truy cập", bạn chọn tài khoản của mình > bấm "Nâng cao" (Advanced) > chọn "Đi tới Không an toàn" (Go to Untitled project) > Bấm "Cho phép" (Allow))*.
5. Sau khi triển khai xong, Google sẽ cung cấp cho bạn một **URL ứng dụng web** (có dạng: `https://script.google.com/macros/s/AKfycb.../exec`). Hãy sao chép URL này!

---

### Bước 4: Dán URL vào dự án
Mở file [app/wedding-data.ts](file:///d:/Other/duy-lan-wedding-invitation/app/wedding-data.ts) và dán URL vừa sao chép vào trường `googleSheetScriptUrl`:

```typescript
googleSheetScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec",
```

Từ lúc này, mọi lời chúc và xác nhận tham dự của khách trên web sẽ lập tức tự động đồng bộ vào Google Sheets của bạn!
