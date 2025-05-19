# Ballast Lane - FDA Label Processing API

## 🧪 Overview

This is a NestJS-based API designed to process FDA SPL (Structured Product Labeling) XML files. It extracts drug indications, attempts to match them to ICD-10 codes using public APIs and OpenAI, and stores the result in a PostgreSQL database.

## 📚 External Data Sources

This project integrates with two external data providers to fetch and process drug labeling and classification information:

#### 🔹 DailyMed (U.S. National Library of Medicine)
- **Used for**: Fetching the SPL (Structured Product Labeling) XML of a drug by its name.
- **Endpoints used**:
  - `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?title={drugName}`
    - Returns metadata including `setid` (programId).
  - `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{programId}.xml`
    - Returns the full SPL XML for a given drug.

#### 🔹 Clinical Tables API (U.S. National Library of Medicine)
- **Used for**: Searching ICD-10-CM codes by disease name/title.
- **Endpoint used**:
  - `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=name&terms={query}`
    - Returns a list of ICD-10 codes and associated titles matching the term.

Both APIs are public and do not require authentication.

---

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js >= 20
- Yarn
- Docker + Docker Compose

### 2. Clone and configure

```bash
git clone https://github.com/your-org/ballast-lane-test.git
cd ballast-lane-test
```

Create a `.env` file in the root:

```env
DAILYMED_API_BASE=https://dailymed.nlm.nih.gov/dailymed/services/v2
ICD10_API_BASE=https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search
OPENAI_API_KEY=your-openai-key
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=labels
```

### 3. Run the project

```bash
docker-compose up --d
```

> Access the app at `http://localhost:3000/api`

---

## 📘 API Documentation

- Swagger UI: [http://localhost:3000/api](http://localhost:3000/api)

### 🔐 Auth

All routes require a bearer token, except:
- `POST /api/auth/register`
- `POST /api/auth/login`

### 📡 Key Endpoints

| Method | Endpoint                            | Description                                               |
|--------|-------------------------------------|-----------------------------------------------------------|
| **Auth**                                                                                          |
| POST   | `/api/auth/register`                | Registers a new user                                      |
| POST   | `/api/auth/login`                   | Logs in a user and returns a JWT                          |

| **Labels**                                                                                        |
| POST   | `/api/labels/process`               | Processes and stores label indications from DailyMed      |

| **Programs**                                                                                      |
| GET    | `/api/programs`                     | Lists programs with optional search filters               |
| GET    | `/api/programs/:program_id`         | Returns a single program with its related indications     |

| **Indications**                                                                                   |
| POST   | `/api/indications`                  | Creates a new indication                                  |
| GET    | `/api/indications`                  | Lists all indications                                     |
| GET    | `/api/indications/:id`              | Gets a specific indication by ID                          |
| PATCH  | `/api/indications/:id`              | Updates an existing indication                            |
| DELETE | `/api/indications/:id`              | Deletes an indication                                     |


---

## 📦 Sample Output

```json
[
  {
    "id": 1,
    "title": "Asthma",
    "description": "DUPIXENT is indicated as an add-on maintenance treatment...",
    "icd10Code": "J45",
    "icd10Title": "Asthma",
    "source": "dataset"
  }
]
```

---

## ⚙️ Scalability Considerations

- **Job Queue**: Offload heavy XML parsing and AI calls using a queue (e.g., BullMQ).
- **Caching**: Use Redis for ICD-10 code caching.
- **API Limits**: Rate-limit external API calls and implement backoff logic.
- **Fallback Strategy**: Use manual tagging or retry when AI or APIs fail.

---

## 🧠 Potential Improvements & Production Challenges

| Topic              | Challenge/Improvement                                                                 |
|--------------------|----------------------------------------------------------------------------------------|
| OpenAI Integration | Expensive + failure-prone. Add fallback and circuit breaker.                         |
| XML Variants       | SPL structures may vary by drug. Add robust parsing logic for edge cases.            |
| Role-based Access  | Implement user roles and ownership per label.                                        |
| Auditing           | Record changes to ICD10 mappings for compliance.                                     |
| Test Coverage      | Coverage is >90% for services/controllers. Watch for gaps on new features.           |

---

## ✅ Running Tests

```bash
yarn test
yarn test:cov
```

> Ensure your local PostgreSQL or Docker DB is running for integration tests.


