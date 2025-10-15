import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ISSUER_API_URL = process.env.ISSUER_API_URL || "http://127.0.0.1:5001";

export async function fetchCertificates() {
  try {
    const response = await axios.get(`${ISSUER_API_URL}/certificates`);
    const data = response.data;
    
    const certificates = [];
    let idCounter = 1000; // Start with high numbers to avoid conflicts
    
    // Process MockUdemy certificates
    if (data.MockUdemy) {
      data.MockUdemy.forEach(cert => {
        certificates.push({
          id: idCounter++, // Use numeric ID
          externalId: cert.certificate_id, // Keep original ID for reference
          filename: `${cert.certificate_id}.pdf`,
          originalName: `${cert.course_name}.pdf`,
          verified: true,
          uploadedAt: cert.issued_date,
          source: 'MockUdemy',
          isExternal: true, // Mark as external certificate
          report: `Certificate found in MockUdemy API\nCourse: ${cert.course_name}\nIssued: ${cert.issued_date}\nExternal ID: ${cert.certificate_id}\nSource: MockUdemy`
        });
      });
    }
    
    // Process MockCoursera certificates  
    
    if (data.MockCoursera) {
      data.MockCoursera.forEach(cert => {
        certificates.push({
          id: idCounter++, // Use numeric ID
          externalId: cert.certificate_id, // Keep original ID for reference
          filename: `${cert.certificate_id}.pdf`,
          originalName: `${cert.course_name}.pdf`,
          verified: true,
          uploadedAt: cert.issued_date,
          source: 'MockCoursera',
          isExternal: true, // Mark as external certificate
          report: `Certificate found in MockCoursera API\nCourse: ${cert.course_name}\nIssued: ${cert.issued_date}\nExternal ID: ${cert.certificate_id}\nSource: MockCoursera`
        });
      });
    }
    
    return certificates;
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw error;
  }
}
