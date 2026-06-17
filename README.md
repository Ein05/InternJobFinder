# 🎓 UniHub InternJobFinder — Quy trình Data Engineering & Website tuyển dụng

**UniHub InternJobFinder** là nền tảng thu thập, xử lý dữ liệu và kết nối sinh viên với các cơ hội thực tập, sự kiện học thuật và cuộc thi công nghệ/kinh doanh tại Hà Nội. 

Dự án được xây dựng dựa trên kiến trúc **Data Pipeline (ETL)** hiện đại chuẩn Data Engineering nhằm tự động hóa quy trình cào thông tin, làm sạch, khử trùng lặp và phân phối dữ liệu thông qua REST API tới ứng dụng React.

---

## 🏗️ Kiến Trúc Hệ Thống (Data Pipeline Architecture)

Quy trình xử lý dữ liệu được thiết kế chia tầng tối ưu hiệu năng và độ ổn định:

```
[Mạng xã hội & Web] (Facebook, Ybox, ITviec, TopCV...)
       │
       ▼ (Python Ingestion: Google Custom Search API + BeautifulSoup)
┌─────────────────────────────────────────────────────────────────┐
│ 1. DATA LAKE (Bronze Layer - Azure Blob Storage & Local JSON)   │
│    Lưu trữ toàn bộ file JSON thô của từng lần cào để dự phòng   │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼ (Python ETL & Data Quality: Pandas & Great Expectations)
       ▼ (Fuzzy Matching Deduplication: RapidFuzz >85%)
┌─────────────────────────────────────────────────────────────────┐
│ 2. DATA WAREHOUSE (Gold Layer - PostgreSQL Database)            │
│    Dữ liệu được làm sạch cấu trúc bảng, tự động đánh Index      │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. REST API SERVICE (FastAPI - Connection Pooling)              │
│    Cung cấp các endpoint lọc, tìm kiếm siêu nhanh cho Web       │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. WEB APPLICATION (React + Vite - Resilient Fallback)          │
│    Giao diện người dùng mượt mà, tự động chuyển về file tĩnh    │
│    nếu API sập                                                  │
└─────────────────────────────────────────────────────────────────┘
       ▲
       └─────── [Bộ điều phối Apache Airflow lập lịch tự động chạy DAG]
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Data Pipeline & Crawling**: Python (Requests, BeautifulSoup, Pandas, RapidFuzz).
* **Database (Data Warehouse)**: PostgreSQL 15.
* **Orchestration (Điều phối)**: Apache Airflow (LocalExecutor).
* **Backend API**: Python FastAPI (Uvicorn, Connection Pooling).
* **Frontend**: React (Vite), Vanilla CSS (Glassmorphism & Micro-animations).
* **Cloud Infrastructure**: Azure Blob Storage (Data Lake Bronze), Azure Static Web Apps (SWA).
* **Virtualization**: Docker & Docker Compose.

---

## 🚦 Hướng Dẫn Cài Đặt & Chạy Hệ Thống Cục Bộ

### 📋 Yêu Cầu Trước Khi Cài Đặt:
1. Đã cài đặt **Docker Desktop** (và kích hoạt WSL 2 trên Windows).
2. Đã cài đặt **Python 3.10+** và **Node.js** (để chạy frontend/backend).

---

### 1️⃣ Bước 1: Khởi động Cơ sở hạ tầng (Postgres & Airflow)
Mở ứng dụng Docker Desktop, sau đó chạy lệnh sau tại thư mục gốc dự án để kích hoạt các Container chạy ngầm:
```bash
docker-compose up -d
```
*Lưu ý: Quá trình khởi chạy lần đầu tiên sẽ mất vài phút để tải Docker Images và khởi tạo môi trường.*

### 2️⃣ Bước 2: Kích hoạt luồng dữ liệu tự động (Airflow DAG)
1. Truy cập vào giao diện web điều phối Apache Airflow: `http://localhost:8080`.
2. Đăng nhập với tài khoản:
   * **Username**: `admin`
   * **Password**: `admin`
3. Tại danh sách, chọn DAG `intern_job_finder_pipeline`.
4. Bật DAG (chuyển công tắc sang **Active**) và bấm nút **Trigger DAG** (nút Play màu xanh ở góc phải) để chạy thử quy trình. Luồng công việc sẽ tự động:
   * Khởi tạo cấu trúc bảng SQL.
   * Cào dữ liệu từ Google Custom Search API.
   * Thực hiện làm sạch và khử trùng lặp dữ liệu thô.
   * Chèn dữ liệu đã làm sạch vào database PostgreSQL.

### 3️⃣ Bước 3: Khởi chạy REST API Backend (FastAPI)
1. Cài đặt các thư viện Python cần thiết tại máy local:
   ```bash
   pip install -r requirements.txt
   ```
2. Khởi chạy FastAPI server:
   ```bash
   python backend/main.py
   ```
3. Truy cập `http://localhost:8000/api/jobs` hoặc `http://localhost:8000/api/competitions` để kiểm tra dữ liệu JSON dạng camelCase được xuất trực tiếp từ database.

### 4️⃣ Bước 4: Khởi chạy React Frontend
1. Cài đặt các thư viện Node.js:
   ```bash
   npm install
   ```
2. Khởi chạy dev server:
   ```bash
   npm run dev
   ```
3. Truy cập địa chỉ hiển thị (thường là `http://localhost:5173`) để trải nghiệm website với dữ liệu sạch, cập nhật liên tục từ PostgreSQL Database!

---

## ⚡ Các Cơ Chế Tối Ưu Hóa Nổi Bật

1. **PostgreSQL Connection Pooling (`ThreadedConnectionPool`)**: API backend tái sử dụng các socket kết nối cũ thay vì khởi tạo liên tục trên mỗi lượt truy cập, giúp tối ưu RAM/CPU của server.
2. **Database Indexing**: Đánh chỉ mục thông minh trên các trường lọc (`industry`, `commitment`, `category`, `deadline`) giúp truy vấn luôn đạt tốc độ mili-giây.
3. **Fuzzy Deduplication**: So khớp chuỗi mờ (khoảng cách Levenshtein) loại bỏ các bài đăng trùng lặp nội dung trên mạng xã hội với độ chính xác >85%.
4. **Resilient Fallback**: Frontend tự động nhận diện nếu API database bị offline để chuyển hướng tải các file JSON tĩnh sao lưu tại thư mục `public/data/`, giữ website hoạt động 24/7.
