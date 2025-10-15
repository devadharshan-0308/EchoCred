const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;

// Base paths
const BASE_DATA_PATH = path.join(__dirname, "data");
const CERT_PATH = path.join(__dirname, "certificates");

// Supported issuers
const ISSUERS = ["udemy", "coursera", "futureskill", "ncct", "university"];

// Middleware for JSON responses
app.use(express.json());

// Add CORS headers to allow frontend access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// List all certificates for an issuer
app.get("/api/:issuer", (req, res) => {
    const issuer = req.params.issuer.toLowerCase();
    if (!ISSUERS.includes(issuer)) {
        return res.status(400).json({ status: "error", message: "Unsupported issuer" });
    }

    const issuerDir = path.join(BASE_DATA_PATH, issuer);
    if (!fs.existsSync(issuerDir)) {
        return res.status(404).json({ status: "error", message: "Issuer data not found" });
    }

    const files = fs.readdirSync(issuerDir).filter(f => f.endsWith(".json"));
    const certificates = files.map(file => {
        const data = JSON.parse(fs.readFileSync(path.join(issuerDir, file)));
        return {
            certificate_id: data.certificate_id,
            learner_name: data.learner_name,
            course_title: data.course_title,
            completion_date: data.completion_date,
            ncvet_verified: data.ncvet_verified,
            issuer: data.issuer
        };
    });

    res.json({ status: "success", certificates });
});

// Get JSON metadata for a certificate
app.get("/api/:issuer/:certificate_id", (req, res) => {
    const issuer = req.params.issuer.toLowerCase();
    const certId = req.params.certificate_id;
    const certPath = path.join(BASE_DATA_PATH, issuer, `${certId}.json`);

    if (!fs.existsSync(certPath)) {
        return res.status(404).json({ status: "error", message: "Certificate not found" });
    }

    const certData = JSON.parse(fs.readFileSync(certPath));
    res.json({ status: "success", certificate: certData });
});

// Download PDF certificate
app.get("/download/:certificate_id", (req, res) => {
    const certId = req.params.certificate_id;
    const pdfPath = path.join(CERT_PATH, `${certId}.pdf`);

    if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ status: "error", message: "Certificate not found" });
    }

    res.download(pdfPath, `${certId}.pdf`);
});

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to Skill-Valut Mock API. Available endpoints: /api/:issuer, /api/:issuer/:certificate_id, /download/:certificate_id");
});

// Start server
app.listen(PORT, () => {
    console.log(`🎉 Mock API running at http://localhost:${PORT}`);
});
