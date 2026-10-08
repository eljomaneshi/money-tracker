import TrustPageShell from "../components/TrustPageShell";

export default function Privacy() {
  return (
    <TrustPageShell
      title="Privacy & Data Handling"
      lastUpdated="October 8, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Overview
        </h2>
        <p>
          This page explains, in plain language, how MoneyTracker currently handles
          information. It may be updated as the service evolves. This document is
          provided for informational transparency and does not constitute formal
          legal advice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Information You Provide
        </h2>
        <p>
          MoneyTracker collects only the information necessary to provide personal
          finance tracking features to you:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account details:</strong> Email address, password information
            used to authenticate your account, and optional full name.
          </li>
          <li>
            <strong>Financial entries:</strong> Account names, balances, selected
            currencies, recorded expenses, deposits, withdrawals, transfers between
            accounts, recurring subscriptions, and personal financial notes you
            create.
          </li>
          <li>
            <strong>Verification codes:</strong> Temporary email verification codes
            used during registration and email change requests.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          How Information Is Used
        </h2>
        <p>Your information is used solely to operate the service, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Operating and maintaining your personal finance workspace.</li>
          <li>
            Calculating and displaying your balances, spending activity, and
            subscription renewal schedules.
          </li>
          <li>
            Sending transactional emails, including registration verification
            codes and optional subscription notifications you choose to enable.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Third-Party Service Providers
        </h2>
        <p>
          MoneyTracker relies on third-party service providers to host and run the
          application:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Railway:</strong> Application hosting services.
          </li>
          <li>
            <strong>Supabase:</strong> Database services.
          </li>
          <li>
            <strong>Resend:</strong> Transactional email delivery.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Account Deletion & Data Retention
        </h2>
        <p>
          Users can request deletion through Settings after confirming the request.
          Account-associated application data is removed from active systems as part
          of that process. Some information may remain temporarily in backups,
          security logs, email-provider records, or systems where retention is
          necessary for operational, security, or legal reasons.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Artificial Intelligence (AI) Status
        </h2>
        <p>
          MoneyTracker does not currently provide Claude or other AI-powered financial
          analysis features. If optional AI features are introduced in the future,
          MoneyTracker will provide a separate explanation of the information used
          and the user choices available.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Contact
        </h2>
        <p>
          If you have questions about your data or this page, you can reach out
          directly by email at{" "}
          <a
            href="mailto:founder@moneytracker.online"
            className="font-medium text-teal-600 underline dark:text-teal-400"
          >
            founder@moneytracker.online
          </a>
          .
        </p>
      </section>
    </TrustPageShell>
  );
}
