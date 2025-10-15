// pages/api/confirm.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from("subscribers")
      .select("*")
      .eq("confirmation_token", token)
      .single();

    if (findError || !subscriber) {
      return res.status(400).json({ 
        error: "Invalid or expired confirmation link" 
      });
    }

    if (subscriber.confirmed) {
      return res.status(200).json({ 
        message: "Already confirmed!" 
      });
    }

    // Update to confirmed
    const { error: updateError } = await supabase
      .from("subscribers")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
      })
      .eq("id", subscriber.id);

    if (updateError) throw updateError;

    return res.status(200).json({ 
      message: "Subscription confirmed successfully" 
    });

  } catch (error: any) {
    console.error("Confirm error:", error);
    return res.status(500).json({ 
      error: "Failed to confirm subscription" 
    });
  }
}
