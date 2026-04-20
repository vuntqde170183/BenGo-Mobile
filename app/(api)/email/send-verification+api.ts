import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, name, otp } = await request.json();
    console.log("POST /(api)/email/send-verification - Request Body:", { email, name, otp });

    if (!email || !name || !otp) {
      console.warn("POST /(api)/email/send-verification - Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await sendVerificationEmail(email, name, otp);
    console.log("POST /(api)/email/send-verification - Result:", result);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
