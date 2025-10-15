import skillVaultApiIntegration from '../services/skillVaultApiIntegration.js';

const getCertificateUsers = () => {
  try {
    // Get all certificates
    const allCertificates = skillVaultApiIntegration.getAllCertificates();
    
    // Extract unique user emails
    const userEmails = [...new Set(allCertificates.map(cert => cert.learner_email))];
    
    console.log('📧 Users with certificates:');
    userEmails.forEach((email, index) => {
      const userCerts = allCertificates.filter(cert => cert.learner_email === email);
      console.log(`${index + 1}. ${email} (${userCerts.length} certificates)`);
    });
    
    console.log(`\n📊 Total users: ${userEmails.length}`);
    console.log(`📊 Total certificates: ${allCertificates.length}`);
    
    // Show sample certificates for first few users
    console.log('\n📜 Sample certificates:');
    userEmails.slice(0, 3).forEach(email => {
      const userCerts = allCertificates.filter(cert => cert.learner_email === email);
      console.log(`\n👤 ${email}:`);
      userCerts.slice(0, 2).forEach(cert => {
        console.log(`   - ${cert.course_title} (${cert.issuer})`);
      });
    });
    
    return userEmails;
  } catch (error) {
    console.error('Error getting certificate users:', error);
    return [];
  }
};

getCertificateUsers();
