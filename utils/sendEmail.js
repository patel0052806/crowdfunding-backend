const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    console.log('--- Initiating sendEmail ---');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

    try {
        // If SMTP variables are present, prefer SMTP (works both locally and on Render).
        const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

        if (hasSMTP) {
            console.log('SMTP_* variables detected — using SMTP (Nodemailer).');
            const smtpConfig = {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            };
            console.log('SMTP Config:', { host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure, user: smtpConfig.auth.user });
            const transporter = nodemailer.createTransport(smtpConfig);

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL ? `Crowdfunding App <${process.env.SMTP_FROM_EMAIL}>` : 'Crowdfunding App <no-reply@crowdfunding.com>',
                to: options.email,
                subject: options.subject,
                html: options.html,
            };

            console.log('Sending email with Nodemailer (SMTP) with options:', { to: mailOptions.to, from: mailOptions.from, subject: mailOptions.subject });
            try {
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent successfully with Nodemailer (SMTP).');
                return { info };
            } catch (smtpErr) {
                console.error('SMTP send failed:', smtpErr);

                // If SendGrid is available, attempt fallback (useful when host blocks outbound SMTP)
                if (process.env.SENDGRID_API_KEY) {
                    try {
                        console.log('Attempting fallback: sending email via SendGrid API because SMTP failed.');
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        const fromAddress = process.env.SENDGRID_FROM || process.env.SMTP_FROM_EMAIL || 'no-reply@crowdfunding.com';
                        const msg = {
                            to: options.email,
                            from: fromAddress,
                            subject: options.subject,
                            html: options.html,
                        };
                        await sgMail.send(msg);
                        console.log('Email sent successfully with SendGrid (fallback).');
                        return;
                    } catch (sgErr) {
                        console.error('SendGrid fallback failed:', sgErr);
                        if (sgErr.response) console.error(`SendGrid response error body: ${JSON.stringify(sgErr.response.body)}`);
                    }
                }

                // rethrow original SMTP error if no fallback succeeded
                throw smtpErr;
            }
        }

        // No SMTP configured => fall back to SendGrid for production, Ethereal for development
        if (process.env.NODE_ENV === 'production') {
            console.log('Production environment detected. Using SendGrid.');
            console.log(`SENDGRID_API_KEY is set: ${!!process.env.SENDGRID_API_KEY}`);

            if (!process.env.SENDGRID_API_KEY) {
                console.error('FATAL: SENDGRID_API_KEY environment variable is not set for production and SMTP_* not provided.');
                throw new Error('Email service is not configured for production. Set SENDGRID_API_KEY or SMTP_* environment variables.');
            }

            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

            const fromAddress = process.env.SENDGRID_FROM || process.env.SMTP_FROM_EMAIL || 'no-reply@crowdfunding.com';
            const msg = {
                to: options.email,
                from: fromAddress, // Make sure this sender is verified in SendGrid
                subject: options.subject,
                html: options.html,
            };

            console.log('Sending email with SendGrid with options:', { to: msg.to, from: msg.from, subject: msg.subject });
            await sgMail.send(msg);
            console.log('Email sent successfully with SendGrid.');
            return;
        }

        // Development fallback: use Ethereal when SMTP is not configured
        console.log('Development or other environment detected. Using Nodemailer (Ethereal) for email.');
        console.warn('SMTP_* environment variables not fully set. Creating Ethereal test account.');
        const testAccount = await nodemailer.createTestAccount();
        const devTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        const devMailOptions = {
            from: process.env.SMTP_FROM_EMAIL ? `Crowdfunding App <${process.env.SMTP_FROM_EMAIL}>` : 'Crowdfunding App <no-reply@crowdfunding.com>',
            to: options.email,
            subject: options.subject,
            html: options.html,
        };

        console.log('Sending email with Nodemailer (Ethereal) with options:', { to: devMailOptions.to, from: devMailOptions.from, subject: devMailOptions.subject });
        const info = await devTransporter.sendMail(devMailOptions);
        console.log('Email sent successfully with Nodemailer (Ethereal).');
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Development email preview available at: ${previewUrl}`);
        }
        return { info };

    } catch (err) {
        console.error('--- Email sending failed ---');
        console.error('Full error object:', err);
        if (err.response) {
            console.error(`SendGrid response error body: ${JSON.stringify(err.response.body)}`);
        }
        // Wrap the original error to provide more context for debugging.
        throw new Error(`Email sending failed. Reason: ${err.message}`);
    } finally {
        console.log('--- sendEmail finished ---');
    }
};

module.exports = sendEmail;