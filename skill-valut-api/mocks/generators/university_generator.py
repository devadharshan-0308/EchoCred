import os
import json
from fpdf import FPDF
from datetime import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CERT_FOLDER = os.path.join(BASE_DIR, "certificates")
DATA_FOLDER = os.path.join(BASE_DIR, "data", "university")
SCHEMA_FILE = os.path.join(BASE_DIR, "schema", "base_schema.json")

os.makedirs(CERT_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Load base schema
with open(SCHEMA_FILE, "r") as f:
    base_schema = json.load(f)

# Predefined learners and their university degrees
learners_certificates = {
    "Alice Johnson": ["B.Sc Computer Science"],
    "Bob Smith": ["B.Com"],
    "Charlie Lee": ["B.A English"],
    "Diana Patel": ["B.Sc Computer Science", "B.A English"],
    "Ethan Brown": ["B.Tech IT"],
    "Fiona Williams": ["B.Com"],
    "George Martin": ["B.Tech IT", "B.Sc Computer Science"]
}

def generate_certificate_data(learner_name, degree_title, index):
    certificate_id = f"UNIV-{index+3000}"
    completion_date = datetime.now().strftime("%Y-%m-%d")
    duration = "3 years" if "B." in degree_title else "4 years"

    cert_data = base_schema.copy()
    cert_data.update({
        "issuer": "University",
        "issuer_type": "ncvet",
        "ncvet_verified": True,
        "certificate_id": certificate_id,
        "learner_name": learner_name,
        "certificate_title": "Degree Certificate",
        "course_title": degree_title,
        "completion_date": completion_date,
        "verification_url": f"https://university.edu/verify/{certificate_id}",
        "metadata": {
            **base_schema["metadata"],
            "organization_name": "Prestige University",
            "organization_logo": "university_logo.png",
            "issue_date": completion_date,
            "course_duration": duration,
            "accreditation_info": "Nationally Accredited",
            "signatories": ["Registrar", "Vice Chancellor"],
            "credential_type": "Degree",
            "language": "English"
        }
    })
    return cert_data

def generate_pdf(cert_data):
    pdf_path = os.path.join(CERT_FOLDER, f"{cert_data['certificate_id']}.pdf")
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_font("Arial", "B", 28)
    pdf.cell(0, 15, cert_data["metadata"]["organization_name"], ln=True, align="C")
    pdf.set_font("Arial", "", 20)
    pdf.cell(0, 15, cert_data["certificate_title"], ln=True, align="C")
    pdf.set_font("Arial", "", 16)
    pdf.ln(10)
    pdf.multi_cell(0, 10, f"This certifies that {cert_data['learner_name']} has successfully completed the program:", align="C")
    pdf.set_font("Arial", "B", 18)
    pdf.ln(5)
    pdf.multi_cell(0, 10, cert_data["course_title"], align="C")
    pdf.set_font("Arial", "", 14)
    pdf.ln(10)
    pdf.cell(0, 10, f"Duration: {cert_data['metadata']['course_duration']}", ln=True, align="C")
    pdf.cell(0, 10, f"Completion Date: {cert_data['completion_date']}", ln=True, align="C")
    pdf.cell(0, 10, f"Certificate ID: {cert_data['certificate_id']}", ln=True, align="C")
    pdf.cell(0, 10, f"Verify at: {cert_data['verification_url']}", ln=True, align="C")
    pdf.output(pdf_path)
    return pdf_path

def main():
    index = 0
    for learner, degrees in learners_certificates.items():
        for degree in degrees:
            cert_data = generate_certificate_data(learner, degree, index)
            generate_pdf(cert_data)
            json_path = os.path.join(DATA_FOLDER, f"{cert_data['certificate_id']}.json")
            with open(json_path, "w") as f:
                json.dump(cert_data, f, indent=2)
            print(f"Generated {cert_data['certificate_id']} for {learner}: {degree}")
            index += 1

if __name__ == "__main__":
    main()
