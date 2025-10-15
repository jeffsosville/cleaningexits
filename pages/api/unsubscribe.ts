// pages/api/unsubscribe.ts
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
  const { token } = req.method === "GET" ? req.query : req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  // GET - Fetch subscriber email for confirmation
  if (req.method === "GET") {
    try {
      const { data: subscriber, error } = await supabase
        .from("subscribers")
        .select("email")
        .eq("unsubscribe_token", token)
        .eq("confirmed", true)
        .is("unsubscribed_at", null)
        .single();

      if (error || !subscriber) {
        return res.status(400).json({ 
          error: "Invalid or expired unsubscribe link" 
        });
      }

      return res.status(200).json({ subscriber });
    } catch (error) {
      console.error("Fetch subscriber error:", error);
      return res.status(500).json({ error: "Failed to load subscriber" });
    }
  }

  // POST - Unsubscribe
  if (req.method === "POST") {
    try {
      const { data: subscriber, error: findError } = await supabase
        .from("subscribers")
        .select("id")
        .eq("unsubscribe_token", token)
        .single();

      if (findError || !subscriber) {
        return res.status(400).json({ 
          error: "Invalid unsubscribe link" 
        });
      }

      // Mark as unsubscribed
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("id", subscriber.id);

      if (updateError) throw updateError;

      return res.status(200).json({ 
        message: "Successfully unsubscribed" 
      });

    } catch (error) {
      console.error("Unsubscribe error:", error);
      return res.status(500).json({ 
        error: "Failed to unsubscribe" 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
