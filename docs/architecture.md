# ETF Trading Pipeline - System Architecture

## Production Architecture (ahnbi2.suwon.ac.kr)

```mermaid
graph TD
    %% 스타일 정의
    classDef docker fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#01579b;
    classDef host fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#4a148c;
    classDef db fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#f9a825;
    classDef user fill:#212121,stroke:#000,stroke-width:2px,color:#fff;
    classDef script fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#c62828;

    %% 1. 외부 사용자
    USER(("External User")):::user

    %% 2. 원격 서버 (Production)
    subgraph "Production Server (ahnbi2.suwon.ac.kr)"

        %% 자동화
        subgraph "Automation"
            CRON["Cron Daemon"]:::host
            SCRIPTS["start.sh
predict-daily.sh"]:::script
        end

        %% Docker Compose 환경
        subgraph "Docker Compose Environment"

            subgraph "Container: web-dashboard"
                NEXT["Next.js Dashboard
(Port 3000)"]:::docker
            end

            subgraph "Container: etf-ml-service"
                FASTAPI["FastAPI ML Service
(Port 8000)"]:::docker
                SQLITE[("SQLite
predictions.db")]:::db
            end
        end

        %% 호스트의 MySQL
        MYSQL[("MySQL Database
etf2_db (Port 5100)
~500 tables")]:::db

    end

    %% --- 연결 흐름 ---

    %% 외부 접근
    USER --> |"https://ahnbi2.suwon.ac.kr
(Nginx Reverse Proxy)"| NEXT
    USER --> |"API 직접 접근 (Optional)"| FASTAPI

    %% 자동화 실행
    CRON -.-> |"Schedule"| SCRIPTS
    SCRIPTS -.-> |"docker exec / curl"| FASTAPI

    %% 프론트 → 백엔드
    NEXT --> |"Internal Docker Network
http://ml-service:8000"| FASTAPI

    %% 백엔드 → DB
    FASTAPI <--> |"Save"| SQLITE
    FASTAPI <--> |"host.docker.internal:5100
(No SSH Tunnel Needed!)"| MYSQL

    %% 링크 스타일
    linkStyle 4 stroke:#01579b,stroke-width:2px;
    linkStyle 6 stroke:#fbc02d,stroke-width:2px;
```

## ASCII Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Production Server (ahnbi2.suwon.ac.kr)                       │
│                                                                              │
│   ┌─────────┐      ┌────────────────────────────────────────────────────┐   │
│   │  Cron   │─────▶│              Docker Compose                         │   │
│   │  Jobs   │      │                                                     │   │
│   └─────────┘      │  ┌─────────────────┐    ┌─────────────────────┐   │   │
│                    │  │  web-dashboard  │    │    ml-service       │   │   │
│                    │  │  (Next.js)      │───▶│    (FastAPI)        │   │   │
│   External User ──▶│  │  Port 3000      │    │    Port 8000        │   │   │
│                    │  └─────────────────┘    │         │           │   │   │
│                    │                          │    ┌────▼────┐     │   │   │
│                    │                          │    │ SQLite  │     │   │   │
│                    │                          └────┴────┬────┴─────┘   │   │
│                    └────────────────────────────────────┼──────────────┘   │
│                                                         │                   │
│                                          host.docker.internal:5100          │
│                                                         │                   │
│   ┌─────────────────────────────────────────────────────▼─────────────────┐ │
│   │                    MySQL (etf2_db) - Port 5100                         │ │
│   │                    AAPL_D, NVDA_1h, ... (~500 tables)                  │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Description

| Component | Port | Description |
|-----------|------|-------------|
| Next.js Dashboard | 3000 | 웹 대시보드 (포트폴리오, 예측 결과, 수익률) |
| FastAPI ML Service | 8000 | REST API (예측, 데이터 조회) |
| MySQL | 5100 | 주가 데이터 (~500 ETF 테이블) |
| SQLite | - | 예측 결과 저장 (Volume mounted) |

## Data Flow

1. **User Request**: External User → Nginx → Next.js (Port 3000)
2. **API Call**: Next.js → FastAPI (Internal Docker Network)
3. **Data Fetch**: FastAPI → MySQL (host.docker.internal:5100)
4. **Save Prediction**: FastAPI → SQLite (Local Volume)
5. **Scheduled Task**: Cron → Scripts → FastAPI Batch API

## Key Configuration

### Docker Network
- 컨테이너 간 통신: Docker 내부 네트워크 사용
- 호스트 DB 접근: `host.docker.internal:5100`

### Environment Variables
```env
# ml-service
REMOTE_DB_URL=mysql+pymysql://ahnbi2:bigdata@host.docker.internal:5100/etf2_db
LOCAL_DB_PATH=/app/data/predictions.db

# web-dashboard
NEXT_PUBLIC_API_URL=http://ml-service:8000
```
