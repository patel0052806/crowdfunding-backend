const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Build mail options
    const mailOptions = {
        from: process.env.EMAIL ? `Crowdfunding App <${process.env.EMAIL}>` : 'Crowdfunding App <no-reply@crowdfunding.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        let transporter;

        if (process.env.EMAIL_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                secure: Number(process.env.EMAIL_PORT) === 465,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        } else if (process.env.EMAIL && process.env.PASSWORD) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });
        } else if (process.env.NODE_ENV !== 'production') {
            // No configuration provided -> create an Ethereal test account (dev only)
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
            console.warn('EMAIL_* env vars are not set. Using Ethereal test account for email (development only).');
        } else {
            console.error('Email service is not configured for production.');
            throw new Error('Email service is not configured.');
        }

        const info = await transporter.sendMail(mailOptions);

        // If using Ethereal, log preview URL and return it to the caller
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Preview email available at: ${previewUrl}`);
        }

        return { info, previewUrl };

    } catch (err) {
        console.error('Failed to send email:', err);
        throw err; // Let the caller decide how to handle the failure
    }
};

module.exports = sendEmail;
