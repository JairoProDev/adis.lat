'use client';

import { FormEvent, useMemo, useState } from 'react';

type RequestType = 'account_and_data' | 'data_only';

export default function AccountDeletionPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [details, setDetails] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('account_and_data');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = useMemo(
    () =>
      requestType === 'account_and_data'
        ? 'Delete account and associated data'
        : 'Delete some or all personal data only',
    [requestType]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/account-deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          details,
          requestType,
        }),
      });

      const payload = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(payload.error ?? 'Could not submit request. Please try again.');
        return;
      }

      setMessage(
        payload.message ??
          'Your request was submitted. We will contact you by email to confirm and process it.'
      );
      setEmail('');
      setFullName('');
      setDetails('');
      setRequestType('account_and_data');
    } catch {
      setError('Network error. Please try again in a few minutes.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Account and data deletion</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This page allows Buscadis users to request account deletion and/or personal data deletion.
          You can submit a request even if you cannot log in.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold">What happens after submitting?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>We verify account ownership via email.</li>
            <li>We process requests in up to 10 business days.</li>
            <li>
              Legal/security records may be retained for up to 90 days where required by law or anti-fraud
              obligations.
            </li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-slate-200 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Request type</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as RequestType)}
            >
              <option value="account_and_data">Delete account and associated data</option>
              <option value="data_only">Delete some/all data without deleting account</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Selected: {typeLabel}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email used in Buscadis</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Full name (optional)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Tell us what data should be deleted (favorites, profile, business page, etc.)"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting request...' : 'Submit deletion request'}
          </button>
        </form>
      </section>
    </main>
  );
}
