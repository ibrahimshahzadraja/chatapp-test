"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (email, verifyCode) => {
    await resend.emails.send({
        to: email,
        from: 'verify@safenotes.site',
        subject: 'Chat Application Verification Code',
        html: `<h2>Verification Code: </h2><h4>${verifyCode}</h4><p>Use within 30 minutes.</p>`
    })
}