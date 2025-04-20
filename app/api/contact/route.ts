import { NextResponse } from "next/server";
import config from "@/config";

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

    // In a real application, you would use a service like Resend, SendGrid, or Nodemailer here
    // For now, we'll just log the data and simulate a successful email send
    console.log("Contact form submission received:", {
      to: to || config.gmail?.supportEmail,
      from: email,
      name: `${firstName} ${lastName}`,
      subject: subject || "Contact Form Submission",
      message,
    });

    // Simulate a delay as if we're sending an email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing contact form submission:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    );
  }
} 