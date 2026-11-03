# LockIn Backend API

Backend demo cho ứng dụng học tập cùng bạn bè. NestJS + TypeScript, REST API, Swagger tương tác; đúng **2 nhóm API, 8 endpoint**. Không database, authentication hay frontend. Dữ liệu được lưu trong bộ nhớ và mất khi tiến trình restart, redeploy hoặc instance bị dừng. Chỉ dùng một instance cho bản demo này.

## Chạy local

Yêu cầu Node.js 22 và npm.

```powershell
npm ci
npm run build
npm run start:prod
```

Mở Swagger: <http://localhost:3000/api/docs>. Tài liệu JSON: <http://localhost:3000/api/docs-json>.

Mặc định cổng `3000`. Đổi cổng trong PowerShell trước khi chạy:

```powershell
$env:PORT = '3001'
npm run start:prod
```

Ứng dụng đọc biến môi trường của tiến trình, không tự nạp file `.env`. `.env.example` chỉ là tài liệu tham khảo. Server lắng nghe trên `0.0.0.0`.

## API

| Nhóm Swagger | Method | Đường dẫn | Chức năng |
| --- | --- | --- | --- |
| Commitments | POST | `/commitments` | Tạo cam kết, trạng thái mặc định `scheduled` |
| Commitments | GET | `/commitments` | Danh sách cam kết |
| Commitments | GET | `/commitments/{id}` | Chi tiết cam kết |
| Commitments | PATCH | `/commitments/{id}` | Cập nhật các trường được gửi |
| Invitations | POST | `/commitments/{id}/invitations` | Mời bạn, trạng thái mặc định `pending` |
| Invitations | GET | `/invitations` | Danh sách lời mời |
| Invitations | PATCH | `/invitations/{id}/accept` | Chấp nhận lời mời đang `pending` |
| Invitations | PATCH | `/invitations/{id}/decline` | Từ chối lời mời đang `pending` |

- ID do server tạo bằng UUID; `createdAt` do server ghi.
- Thời gian là ISO 8601 có timezone (`Z` hoặc `+07:00`), `endTime > startTime`, kể cả khi PATCH chỉ thay một mốc thời gian.
- Commitment có trạng thái `scheduled`, `completed`, `cancelled`. PATCH cho phép đổi giữa ba trạng thái này.
- Một invitee chỉ được mời một lần vào cùng commitment. Invitation đã accepted/declined không được thay đổi trạng thái lần nữa.
- `400`: body sai, trường thừa, giá trị null, thời gian không hợp lệ. `404`: không có ID tương ứng. `409`: lời mời trùng hoặc chuyển trạng thái không hợp lệ.
- `creatorId` và `inviteeId` là chuỗi ID demo; không cần tạo tài khoản. Không gửi thông tin thật vào demo công khai.

## Kịch bản demo trên Swagger

Mở `/api/docs`, mở từng endpoint, chọn **Try it out** nếu cần, nhập body/ID rồi **Execute**. Swagger gọi API cùng origin với trang docs, nên cũng dùng được trên Render mà không sửa URL server.

1. **POST /commitments** với body sau. Kỳ vọng `201`, lưu `id` trả về làm `COMMITMENT_ID`.

   ```json
   {
     "title": "Study NestJS for one hour",
     "description": "Review controllers, services and DTO validation.",
     "creatorId": "user-1",
     "startTime": "2026-11-10T09:00:00+07:00",
     "endTime": "2026-11-10T10:00:00+07:00"
   }
   ```

2. **GET /commitments** → `200`, thấy cam kết vừa tạo.
3. **GET /commitments/{id}** với `COMMITMENT_ID` → `200`.
4. **POST /commitments/{id}/invitations** với `COMMITMENT_ID`, body `{"inviteeId":"user-2"}` → `201`, `status: pending`. Lưu ID lời mời làm `INVITATION_ID`.
5. **GET /invitations** → `200`, thấy lời mời đang pending.
6. **PATCH /invitations/{id}/accept** với `INVITATION_ID`, không cần body → `200`, `status: accepted`.
7. **GET /invitations** → xác nhận status đã đổi thành accepted.
8. **GET /commitments/{id}** với `missing-id` → `404`.
9. **POST /commitments** với `{}` → `400` cùng danh sách lỗi bắt buộc. Thử body ở bước 1 nhưng đặt `endTime` bằng `startTime` → `400`.
10. **PATCH /commitments/{id}** với `COMMITMENT_ID`, body `{"status":"completed"}` → `200`.
11. Tạo lời mời khác với `{"inviteeId":"user-3"}`, lấy ID mới rồi gọi **PATCH /invitations/{id}/decline** → `200`, `status: declined`.
12. Gọi accept/decline lại trên lời mời đã xử lý → `409`. Tạo lại lời mời cùng `COMMITMENT_ID` và `user-2` → `409`.

## Kiểm thử tự động

```powershell
npm test
```

Test build rồi chạy server production thật trên một cổng ngẫu nhiên, gửi HTTP requests và dừng server khi xong. Bao gồm toàn bộ 8 endpoint, workflow accept/decline, validation tạo/cập nhật, tính nguyên tử khi cập nhật sai, timezone, 404/409, CORS, Swagger UI và schema của 8 operation. Không cần dịch vụ ngoài hay thư viện test bổ sung.

## Push lên GitHub

Remote của dự án: <https://github.com/Lockin-4everyung/lockin-backend>.

```powershell
git add .
git commit -m "feat: implement LockIn REST APIs with Swagger"
git push -u origin main
```

## Deploy Render

Cấu hình đã có trong `render.yaml`. Có thể dùng **New → Blueprint** với repo GitHub này, hoặc tạo thủ công theo hướng dẫn sau:

1. Đăng nhập <https://dashboard.render.com>, chọn **New → Web Service**.
2. Kết nối GitHub, chọn repo **Lockin-4everyung/lockin-backend**, branch **main**.
3. Điền:

   | Trường | Giá trị |
   | --- | --- |
   | Name | `lockin-backend` (hoặc tên còn trống) |
   | Language / Runtime | `Node` |
   | Root Directory | Để trống |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Start Command | `npm run start:prod` |
   | Instance Type | `Free` nếu tài khoản hỗ trợ |
   | Health Check Path | `/commitments` |
   | Environment | `NODE_ENV=production` |

   `--include=dev` giữ TypeScript trong bước build ngay cả khi NODE_ENV là production. Node được cố định bằng `.node-version`. Render tự cung cấp `PORT`; không cần secret, database URL hoặc cài Nest CLI.

4. Chọn **Deploy Web Service**, đợi trạng thái **Live**, mở URL do Render cấp.
5. Mở `https://<ten-service-thuc-te>.onrender.com/api/docs`. Chạy lại bước 1–9 ở trên ngay trên Swagger public để kiểm tra **Execute**.

**Link nộp bài là URL Swagger thực tế do Render cấp**, không phải URL ví dụ. Bản source này không khẳng định đã có deployment public. Instance Free có thể tạm dừng khi không dùng; mở link trước buổi demo để dịch vụ khởi động, rồi tạo lại dữ liệu nếu cần.

Tài liệu chính thức: [Render Node deployment](https://render.com/docs/deploy-node-express-app), [Render Blueprint](https://render.com/docs/blueprint-spec), [NestJS Swagger](https://docs.nestjs.com/openapi/introduction).
