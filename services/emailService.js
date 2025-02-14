import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    // Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  generateEmailTemplate(referralData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f8fafc; }
            .button { 
              background-color: #2563eb; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              display: inline-block;
              border-radius: 5px;
              margin: 20px 0;
            }
            .benefits { 
              background-color: #f0f9ff; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You've Been Referred!</h1>
            </div>
            <div class="content">
              <h2>Hello ${referralData.friendName}!</h2>
              <p>Great news! ${referralData.referrerName} has referred you to our ${referralData.courseName} course.</p>
              
              <div class="benefits">
                <h3>What you'll get:</h3>
                <ul>
                  <li>Complete ${referralData.courseName} curriculum</li>
                  <li>Personal mentor support</li>
                  <li>Hands-on projects</li>
                  <li>Industry-recognized certification</li>
                </ul>
              </div>

              <p><strong>Special Referral Offer:</strong> 20% off using code REFERRED20</p>
              
            

              <p><em>This special offer expires in 7 days!</em></p>
            </div>
            <div class="footer">
              <p>Referred by ${referralData.referrerName} (${referralData.referrerEmail})</p>
              <p>If you believe this was sent in error, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendReferralEmail(referralData) {
    try {
      const msg = {
        to: referralData.friendEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'Course Referral Program'
        },
        subject: `${referralData.referrerName} recommended our ${referralData.courseName} course!`,
        html: this.generateEmailTemplate(referralData),
        trackingSettings: {
          clickTracking: {
            enable: true
          },
          openTracking: {
            enable: true
          }
        }
      };
  
      console.log('Sending email to:', msg.to);
      console.log('Email content:', msg.html);
  
      const response = await sgMail.send(msg);
      console.log('Email sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending referral email:', error);
      throw error;
    }
  }
}

export default new EmailService();