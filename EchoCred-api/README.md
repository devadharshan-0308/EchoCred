EchoCred API – Mock Certificates & Mock API
Overview

This project simulates a Micro-Credential Aggregator Platform by creating mock certificates for multiple issuers and serving them via a mock API. It allows developers to test dashboards, verification flows, and data aggregation without relying on real platforms.

Currently, five mock issuers are supported:

Udemy

Coursera

FutureSkills Prime

NCCT

University

Each issuer has mock PDF certificates and JSON metadata generated using Python scripts, following a unified schema.

Folder Structure
skill-valut-api/
│
├── mocks/
│   ├── mock_api.js                ← Main Express server for all issuers
│   ├── schema/
│   │   └── base_schema.json       ← Defines common fields + structure for all certificates
│   │
│   ├── data/                      ← JSON metadata for each certificate
│   │   ├── udemy/
│   │   │   ├── UDEMY-123456.json
│   │   │   └── UDEMY-654321.json
│   │   ├── coursera/
│   │   ├── futureskill/
│   │   ├── ncct/
│   │   └── university/
│   │
│   ├── certificates/              ← Generated PDF certificates
│   │   ├── UDEMY-123456.pdf
│   │   ├── COURSERA-456789.pdf
│   │   └── ...
│   │
│   └── generators/                ← Python scripts to generate mock certificates
│       ├── udemy_generator.py
│       ├── coursera_generator.py
│       ├── futureskill_generator.py
│       ├── ncct_generator.py
│       └── university_generator.py
│
└── README.md

What Has Been Done So Far
1. Certificate Generation

Python scripts for each issuer generate:

PDF certificates in certificates/

JSON metadata in data/<issuer>/

Each script generates at least 4 unique certificates per issuer.

Metadata follows a unified schema defined in base_schema.json.

Certificates include issuer-specific fields like logos, completion date, learner name, verification URL, NCVET verification status, etc.

2. Mock API

Node.js + Express API (mock_api.js) to serve certificates:

/api/:issuer → List all certificates for a given issuer (JSON metadata)

/api/:issuer/:certificate_id → Get full JSON metadata for a specific certificate

/download/:certificate_id → Download PDF of a certificate

API uses single schema for all issuers to keep the structure consistent.

Supports all five mock issuers.

3. Setup Completed

Express installed via npm

Python environment prepared with fpdf and faker to generate PDFs and mock data

Certificates and JSON metadata generated for at least one issuer (Udemy)

Mock API successfully runs locally at:

http://localhost:5001

How to Run
1. Generate Certificates (Python)

For each issuer, navigate to generators/ and run:

python udemy_generator.py
python coursera_generator.py
python futureskill_generator.py
python ncct_generator.py
python university_generator.py


This will create PDFs in certificates/ and JSON files in data/<issuer>/.

2. Start the Mock API (Node.js)

Make sure you are in the mocks folder (where mock_api.js is located):

cd "C:\skill vault api\skill-valut-api\mocks"


Install Express if not already installed:

npm install express


Start the server:

node mock_api.js


Test endpoints in browser or Postman:

List all Udemy certificates:

http://localhost:5001/api/udemy


Get JSON metadata for a certificate:

http://localhost:5001/api/udemy/UDEMY-123456


Download PDF certificate:

http://localhost:5001/download/UDEMY-123456

Next Steps

Generate certificates for all other issuers (Coursera, FutureSkills Prime, NCCT, University).

Test all endpoints for each issuer.

Optionally, add a single endpoint to list all certificates across all issuers for a unified dashboard.

Integrate with front-end dashboards for demonstration purposes.