import { useState } from "react";

export default function SignNDA() {
  const [form, setForm] = useState({
    tenant_id: "demo-tenant",
    listing_id: "demo-listing",
    signer_name: "",
    signer_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sign-nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  } // <-- make sure this brace is here to close handleSubmit

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Sign NDA</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Your full name"
          value={form.signer_name}
          onChange={(e) => setForm({ ...form, signer_name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Your email"
          value={form.signer_email}
          onChange={(e) => setForm({ ...form, signer_email: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing..." : "Sign NDA"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "2rem" }}>
          {result.error ? (
            <p style={{ color: "red", whiteSpace: "pre-wrap" }}>
              Error: {typeof result.error === "string" ? result.error : JSON.stringify(result)}
            </p>
          ) : (
            <div>
              <p><strong>NDA ID:</strong> {result.nda_id}</p>
              <p><strong>SHA256:</strong> {result.sha256}</p>
              <p><strong>Deal Room Link:</strong> <a href={result.deal_link}>{result.deal_link}</a></p>
              {result.pdf_url && (
                <p><a href={result.pdf_url} target="_blank" rel="noreferrer">View Signed PDF</a></p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
