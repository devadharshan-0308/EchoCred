import os
import json
from fpdf import FPDF
from datetime import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CERT_FOLDER = os.path.join(BASE_DIR, "certificates")
DATA_FOLDER = os.path.join(BASE_DIR, "data", "coursera")
SCHEMA_FILE = os.path.join(BASE_DIR, "schema", "base_schema.json")

os.makedirs(CERT_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Load base schema
with open(SCHEMA_FILE, "r") as f:
    base_schema = json.load(f)

# Predefined learners and their Coursera certificates
learners_certificates = {
    "Alice Johnson": ["Data Science Specialization", "Machine Learning Specialization"],
    "Bob Smith": ["Python for Everybody", "AI for Everyone"],
    "Charlie Lee": ["Deep Learning Specialization"],
    "Diana Patel": ["Cloud Computing", "Cybersecurity Specialization"],
    "Ethan Brown": ["Digital Marketing"],
    "Fiona Williams": ["Blockchain Basics", "Business Analytics Specialization"],
    "George Martin": ["Google IT Support Professional Certificate"]
}

def generate_certificate_data(learner_name, course_title, index):
    certificate_id = f"COURSERA-{index+1000}"
    completion_date = datetime.now().strftime("%Y-%m-%d")

    cert_data = base_schema.copy()
    cert_data.update({
        "issuer": "Coursera",
        "issuer_type": "non_ncvet",
        "ncvet_verified": False,
        "certificate_id": certificate_id,
        "learner_name": learner_name,
        "certificate_title": "Certificate of Completion",
        "course_title": course_title,
        "completion_date": completion_date,
        "verification_url": f"https://www.coursera.org/verify/{certificate_id}",
        "metadata": {
            **base_schema["metadata"],
            "instructor_name": "Coursera Instructor",
            "organization_name": "Coursera, Inc.",
            "organization_logo": "coursera_logo.png",
            "issue_date": completion_date,
            "credential_type": "Course Completion",
            "signatories": ["Coursera Team"],
            "language": "English"
        }
    })
    return cert_data

def generate_pdf(cert_data):
    pdf_path = os.path.join(CERT_FOLDER, f"{cert_data['certificate_id']}.pdf")
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_font("Arial", "B", 28)
    pdf.cell(0, 15, "Coursera", ln=True, align="C")
    pdf.set_font("Arial", "", 20)
    pdf.cell(0, 15, cert_data["certificate_title"], ln=True, align="C")
    pdf.set_font("Arial", "", 16)
    pdf.ln(10)
    pdf.multi_cell(0, 10, f"This certifies that {cert_data['learner_name']} has successfully completed:", align="C")
    pdf.set_font("Arial", "B", 18)
    pdf.ln(5)
    pdf.multi_cell(0, 10, cert_data["course_title"], align="C")
    pdf.set_font("Arial", "", 14)
    pdf.ln(10)
    pdf.cell(0, 10, f"Completion Date: {cert_data['completion_date']}", ln=True, align="C")
    pdf.cell(0, 10, f"Certificate ID: {cert_data['certificate_id']}", ln=True, align="C")
    pdf.cell(0, 10, f"Verify at: {cert_data['verification_url']}", ln=True, align="C")
    pdf.output(pdf_path)
    return pdf_path

def main():
    index = 0
    for learner, courses in learners_certificates.items():
        for course in courses:
            cert_data = generate_certificate_data(learner, course, index)
            generate_pdf(cert_data)
            json_path = os.path.join(DATA_FOLDER, f"{cert_data['certificate_id']}.json")
            with open(json_path, "w") as f:
                json.dump(cert_data, f, indent=2)
            print(f"Generated {cert_data['certificate_id']} for {learner}: {course}")
            index += 1

if __name__ == "__main__":
    main()
