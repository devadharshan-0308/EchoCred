# udemy_generator.py
import os
import json
from fpdf import FPDF
from faker import Faker

# --- Paths (expects this file at: mocks/generators/udemy_generator.py) ---
GEN_DIR = os.path.dirname(os.path.abspath(__file__))                  # .../mocks/generators
BASE_DIR = os.path.dirname(GEN_DIR)                                   # .../mocks
CERT_FOLDER = os.path.join(BASE_DIR, "certificates")
DATA_FOLDER = os.path.join(BASE_DIR, "data", "udemy")
SCHEMA_FILE = os.path.join(BASE_DIR, "schema", "base_schema.json")

os.makedirs(CERT_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# --- Load base schema ---
with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
    base_schema = json.load(f)

faker = Faker()

# --- Predefined users and Udemy courses (exact mapping) ---
users_udemy = {
    "Alice Johnson": [
        {"course_title": "Python Masterclass", "certificate_id": "UDEMY-100001"},
        {"course_title": "Data Science Bootcamp", "certificate_id": "UDEMY-100002"}
    ],
    "Bob Smith": [
        {"course_title": "React for Beginners", "certificate_id": "UDEMY-100003"}
    ],
    "Charlie Lee": [
        {"course_title": "JavaScript Essentials", "certificate_id": "UDEMY-100004"}
    ],
    "Diana Patel": [
        {"course_title": "Excel for Professionals", "certificate_id": "UDEMY-100005"}
    ],
    "Ethan Wong": [
        {"course_title": "SQL Fundamentals", "certificate_id": "UDEMY-100006"}
    ],
    "Fiona Green": [
        {"course_title": "HTML & CSS Basics", "certificate_id": "UDEMY-100007"}
    ],
    "George Brown": [
        {"course_title": "Python Automation", "certificate_id": "UDEMY-100008"}
    ]
}

# --- Helper: build cert metadata from schema + specific fields ---
def build_cert_data(user_name, course_title, cert_id, issue_date="2025-10-01"):
    data = json.loads(json.dumps(base_schema))   # deep copy
    data.update({
        "issuer": "Udemy",
        "issuer_type": "non_ncvet",
        "ncvet_verified": False,
        "certificate_id": cert_id,
        "learner_name": user_name,
        "certificate_title": "Certificate of Completion",
        "course_title": course_title,
        "completion_date": issue_date,
        "verification_url": f"https://www.udemy.com/certificate/{cert_id}"
    })
    # add issuer-specific metadata (keep base_schema.metadata fields)
    meta = data.get("metadata", {})
    meta.update({
        "instructor_name": faker.name(),
        "organization_name": "Udemy, Inc.",
        "organization_logo": "udemy_logo.png",
        "course_duration": "20 hours",
        "language": "English",
        "issue_date": issue_date,
        "credential_type": "Course Completion",
        "signatories": ["Udemy Instructor Team"]
    })
    data["metadata"] = meta
    return data

# --- Helper: generate simple PDF certificate ---
def generate_pdf(cert_data):
    pdf_filename = f"{cert_data['certificate_id']}.pdf"
    pdf_path = os.path.join(CERT_FOLDER, pdf_filename)
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Header
    pdf.set_font("Helvetica", "B", 30)
    pdf.cell(0, 18, "Udemy", ln=True, align="C")
    pdf.ln(4)

    # Title
    pdf.set_font("Helvetica", "B", 22)
    pdf.cell(0, 12, cert_data["certificate_title"], ln=True, align="C")
    pdf.ln(6)

    # Learner
    pdf.set_font("Helvetica", "", 16)
    pdf.multi_cell(0, 10, f"This is to certify that", align="C")
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 10, cert_data["learner_name"], ln=True, align="C")
    pdf.ln(4)

    # Course
    pdf.set_font("Helvetica", "", 16)
    pdf.multi_cell(0, 9, f"has successfully completed the course:", align="C")
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 18)
    pdf.multi_cell(0, 9, cert_data["course_title"], align="C")
    pdf.ln(6)

    # Details
    meta = cert_data.get("metadata", {})
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, f"Duration: {meta.get('course_duration','')}", ln=True, align="C")
    pdf.cell(0, 8, f"Completion Date: {cert_data.get('completion_date','')}", ln=True, align="C")
    pdf.cell(0, 8, f"Certificate ID: {cert_data['certificate_id']}", ln=True, align="C")
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 11)
    pdf.cell(0, 6, f"Verify at: {cert_data['verification_url']}", ln=True, align="C")

    # Footer note
    pdf.ln(12)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, "This is a mock certificate generated for demonstration purposes.", ln=True, align="C")

    pdf.output(pdf_path)
    return pdf_path

# --- Main: create JSON + PDF for every mapped certificate ---
created = []
for user, course_list in users_udemy.items():
    for entry in course_list:
        course_title = entry["course_title"]
        cert_id = entry["certificate_id"]
        cert_data = build_cert_data(user, course_title, cert_id)
        # write JSON metadata
        json_path = os.path.join(DATA_FOLDER, f"{cert_id}.json")
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(cert_data, jf, indent=2, ensure_ascii=False)
        # generate PDF
        pdf_path = generate_pdf(cert_data)
        created.append((cert_id, user, course_title, pdf_path))

# --- Summary output ---
print("=== Udemy generator finished ===")
for cert_id, user, course_title, pdf_path in created:
    print(f"{cert_id} | {user} | {course_title} -> {os.path.relpath(pdf_path, BASE_DIR)}")

print(f"Total certificates created: {len(created)}")
