import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import config from "@/config";

// Create a reusable transporter object for sending emails
const createTransporter = () => {
  // For Google Workspace accounts
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "tyler@oddsmash.io", // your Google Workspace email
      pass: process.env.EMAIL_PASSWORD, // app password generated from Google account security settings
    },
  });
};

// This is the API route that handles contact form submissions
export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    const { firstName, lastName, email, subject, message, to } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if we have the required credentials
    if (!process.env.EMAIL_PASSWORD) {
      console.error("Missing EMAIL_PASSWORD environment variable");
      return NextResponse.json(
        { error: "Email configuration error" },
        { status: 500 }
      );
    }

    // Setup email data
    const mailOptions = {
      from: `"${firstName} ${lastName}" <${email}>`,
      replyTo: email,
      to: to || config.gmail?.supportEmail || "support@oddsmash.io",
      subject: subject || `Contact Form Submission from ${firstName} ${lastName}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #444;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color: #777; font-size: 12px;">This email was sent from the contact form on OddSmash.io</p>
        </div>
      `,
    };

    // Create the email transport
    const transporter = createTransporter();

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    
    // Return a success response
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Error processing contact form submission:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    );
  }
} 