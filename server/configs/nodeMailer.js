// server/configs/nodeMailer.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async ({ to, subject, body }) => {
    console.log(`[Nodemailer] Preparing to send email to: ${to}`);

    // Check if 'to' address is valid before attempting to send
    if (!to) {
        console.error("[Nodemailer] 🚨 FAILED: Recipient email address is missing.");
        return; // Stop here
    }

    try {
        const mailOptions = {
            from: `ShowSnatch <${process.env.SMTP_USER}>`, // Using a name + email is better
            to: to,
            subject: subject,
            html: body,
        };

        console.log("[Nodemailer] Sending email with options:", mailOptions);
        
        const info = await transporter.sendMail(mailOptions);

        console.log("[Nodemailer] ✅ Email sent successfully! Message ID:", info.messageId);
        return info;

    } catch (error) {
        // This will log the exact error message from Brevo/Nodemailer
        console.error("[Nodemailer] 🚨 FAILED to send email. Error:", error);
        // Re-throwing the error can be helpful if you want Inngest to retry the function
        throw error;
    }
};

export default sendEmail;