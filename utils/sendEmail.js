const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL ? `Crowdfunding App <${process.env.SMTP_FROM_EMAIL}>` : 'Crowdfunding App <no-reply@crowdfunding.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        if (process.env.NODE_ENV === 'production') {
            console.log('Production environment detected. Using SendGrid.');
            
            if (!process.env.SENDGRID_API_KEY) {
                console.error('SENDGRID_API_KEY environment variable is not set for production.');
                throw new Error('Email service (SendGrid) is not configured for production.');
            }
            
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
            const msg = {
                to: options.email,
                from: 'harshprogrammer789@gmail.com', // YOU MUST USE A VERIFIED SENDER EMAIL WITH SENDGRID
                subject: options.subject,
                html: options.html,
            };

            console.log('Sending email with SendGrid with options:', msg);
            await sgMail.send(msg);
            console.log('Email sent successfully with SendGrid.');

        } else {
            // For development, use Ethereal if SMTP variables are missing.
            let transporter;
            if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('SMTP_* env vars not set. Using Ethereal test account for development.');
                const testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
            } else {
                transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT),
                    secure: Number(process.env.SMTP_PORT) === 465,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
            }

            const info = await transporter.sendMail(mailOptions);

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`Development email preview available at: ${previewUrl}`);
            }
            return { info };
        }

    } catch (err) {
        console.error('Failed to send email:', err.response ? err.response.body : err);
        // Wrap the original error to provide more context for debugging.
        throw new Error(`Nodemailer/SendGrid failed to send email. Reason: ${err.message}`);
    }
};

module.exports = sendEmail;