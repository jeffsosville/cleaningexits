export default async function handler(req, res) {
  const r = await fetch(
    "https://<your-ref>.supabase.co/functions/v1/nda-sign-v2",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    }
  );
  const data = await r.json();
  res.status(200).json(data);
}
