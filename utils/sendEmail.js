const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL ? `Crowdfunding App <${process.env.SMTP_FROM_EMAIL}>` : 'Crowdfunding App <no-reply@crowdfunding.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        let transporter;

        // In production, require SMTP variables to be set.
        if (process.env.NODE_ENV === 'production') {
            console.log('Production environment detected.');
            console.log(`SMTP Config: Host=${process.env.SMTP_HOST}, Port=${process.env.SMTP_PORT}, User=${process.env.SMTP_USER}`);
            if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.error('SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) are not set for production.');
                throw new Error('Email service is not configured for production.');
            }
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: Number(process.env.SMTP_PORT) === 465, // usually true for port 465
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                connectionTimeout: 10 * 1000, // 10 seconds
            });
        } else {
            // For development, use Ethereal if SMTP variables are missing.
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
        }

        const info = await transporter.sendMail(mailOptions);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Development email preview available at: ${previewUrl}`);
        }

        return { info };

    } catch (err) {
        console.error('Failed to send email:', err);
        // Wrap the original error to provide more context for debugging.
        throw new Error(`Nodemailer failed to send email. Reason: ${err.message}`);
    }
};

module.exports = sendEmail;
