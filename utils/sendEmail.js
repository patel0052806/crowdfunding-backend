const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    console.log('--- Initiating sendEmail ---');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

    try {
        if (process.env.NODE_ENV === 'production') {
            console.log('Production environment detected. Using SendGrid.');
            console.log(`SENDGRID_API_KEY is set: ${!!process.env.SENDGRID_API_KEY}`);
            
            if (!process.env.SENDGRID_API_KEY) {
                console.error('FATAL: SENDGRID_API_KEY environment variable is not set for production.');
                throw new Error('Email service (SendGrid) is not configured for production. SENDGRID_API_KEY is missing.');
            }
            
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
            const msg = {
                to: options.email,
                from: 'harshprogrammer789@gmail.com', // YOU MUST USE A VERIFIED SENDER EMAIL WITH SENDGRID
                subject: options.subject,
                html: options.html,
            };

            console.log('Sending email with SendGrid with options:', { to: msg.to, from: msg.from, subject: msg.subject });
            await sgMail.send(msg);
            console.log('Email sent successfully with SendGrid.');

        } else {
            console.log('Development or other environment detected. Using Nodemailer for email.');
            
            let transporter;
            if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('SMTP_* environment variables not fully set. Using Ethereal test account for development.');
                console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
                console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
                console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
                console.log(`SMTP_PASS is set: ${!!process.env.SMTP_PASS}`);
                
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
                console.log('Using Ethereal transporter.');
            } else {
                console.log('Using custom SMTP settings from environment variables.');
                const smtpConfig = {
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT),
                    secure: Number(process.env.SMTP_PORT) === 465, // common for SMTPS
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                };
                console.log('SMTP Config:', { host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure, user: smtpConfig.auth.user });
                transporter = nodemailer.createTransport(smtpConfig);
            }

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL ? `Crowdfunding App <${process.env.SMTP_FROM_EMAIL}>` : 'Crowdfunding App <no-reply@crowdfunding.com>',
                to: options.email,
                subject: options.subject,
                html: options.html,
            };

            console.log('Sending email with Nodemailer with options:', { to: mailOptions.to, from: mailOptions.from, subject: mailOptions.subject });
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully with Nodemailer.');

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`Development email preview available at: ${previewUrl}`);
            }
            return { info };
        }

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