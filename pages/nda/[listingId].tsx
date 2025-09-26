import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type FormVals = {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_linkedin?: string;
  consent_esign: boolean;
};

const CONSENT_TEXT = `
Consent to Electronic Records and Signatures (ESIGN/UETA).
By checking the box and clicking “Sign & Agree”, you consent to use electronic records and
signatures, acknowledge that your electronic signature is the legal equivalent of your handwritten
signature, and agree to receive the executed agreement electronically. To request a paper copy,
email legal@cleaningexits.com.
`;

function useUTM() {
  const [utms, setUtms] = useState<Record<string, string>>({});
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const out: Record<string, string> = {};
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) out[k] = v;
    });
    setUtms(out);
  }, []);
  return utms;
}

export default function NDAFormPage() {
  const router = useRouter();
  const listingId = useMemo(() => String(router.query.listingId ?? ""), [router.query.listingId]);
  const utms = useUTM();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({ mode: "onSubmit" });

  const onSubmit = async (vals: FormVals) => {
    const resp = await fetch("/api/nda/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        form_slug: "nda",
        listing_id: listingId || null,
        ...vals,
        utms,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      alert(json?.error ?? "Failed to sign. Please try again.");
      return;
    }
    // Success UX: route to a thank-you or deal room
    router.push(`/deal/${listingId}?access=pending`);
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-3">Non-Disclosure Agreement</h1>

      {/* NDA Terms – replace with your full NDA */}
      <section className="rounded border p-4 text-sm leading-relaxed max-h-72 overflow-y-auto mb-4">
        <p className="font-semibold">Mutual Non-Disclosure Agreement</p>
        <p className="mt-2">
          This Agreement governs the disclosure of Confidential Information by and between the
          Disclosing Party and the Recipient for the purpose of evaluating a potential transaction
          related to the listed business. Recipient agrees not to disclose or use the Confidential
          Information except as expressly permitted. (Replace this paragraph with your full NDA
          terms and definitions, exclusions, permitted disclosures, term & termination, remedies,
          governing law, etc.)
        </p>
        <p className="mt-3 whitespace-pre-wrap text-[13px]">{CONSENT_TEXT.trim()}</p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Full Legal Name</label>
          <input
            className="w-full border rounded p-2"
            placeholder="Jane Q. Buyer"
            {...register("buyer_name", { required: true, minLength: 2 })}
          />
          {errors.buyer_name && (
            <p className="text-xs text-red-600 mt-1">Please enter your full legal name.</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full border rounded p-2"
            type="email"
            placeholder="jane@example.com"
            {...register("buyer_email", {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            })}
          />
          {errors.buyer_email && (
            <p className="text-xs text-red-600 mt-1">Enter a valid email address.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Phone (optional)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="(555) 123-4567"
              {...register("buyer_phone")}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">LinkedIn / Website (optional)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="https://linkedin.com/in/you"
              {...register("buyer_linkedin")}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("consent_esign", { required: true })} />
          <span>
            I agree to use electronic records and signatures and I have read the NDA terms above.
          </span>
        </label>
        {errors.consent_esign && (
          <p className="text-xs text-red-600">You must consent to e-sign to continue.</p>
        )}

        <button
          disabled={isSubmitting}
          className="border rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          type="submit"
        >
          {isSubmitting ? "Processing…" : "Sign & Agree"}
        </button>

        {/* tiny legal cues */}
        <p className="text-[11px] text-gray-500">
          By clicking “Sign & Agree”, you adopt your typed name as your electronic signature. We
          capture timestamp, IP, user-agent, listing ID, and UTM parameters for an audit trail.
        </p>
      </form>
    </div>
  );
}
