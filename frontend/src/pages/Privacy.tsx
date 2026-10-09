import TrustPageShell from "../components/TrustPageShell";

export default function Privacy() {
  return (
    <TrustPageShell
      title="Privacy & Data Handling"
      lastUpdated="October 8, 2026"
    >
      <div className="space-y-8 divide-y divide-slate-200/80 dark:divide-white/10 [&>section:not(:first-child)]:pt-8">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Overview
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            This page explains, in plain language, how MoneyTracker currently handles
            information. It may be updated as the service evolves. This document is
            provided for informational transparency and does not constitute formal
            legal advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Information You Provide
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            MoneyTracker collects only the information necessary to provide personal
            finance tracking features to you:
          </p>
          <ul className="list-disc space-y-2.5 pl-5 text-slate-700 dark:text-slate-300">
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">Account details:</strong> Email address, password information
              used to authenticate your account, and optional full name.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">Financial entries:</strong> Account names, balances, selected
              currencies, recorded expenses, deposits, withdrawals, transfers between
              accounts, recurring subscriptions, and personal financial notes you
              create.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">Verification codes:</strong> Temporary email verification codes
              used during registration and email change requests.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            How Information Is Used
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">Your information is used solely to operate the service, including:</p>
          <ul className="list-disc space-y-2.5 pl-5 text-slate-700 dark:text-slate-300">
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
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Third-Party Service Providers
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            MoneyTracker relies on third-party service providers to host and run the
            application:
          </p>
          <ul className="list-disc space-y-2.5 pl-5 text-slate-700 dark:text-slate-300">
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">Railway:</strong> Application hosting services.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">Supabase:</strong> Database services.
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">Resend:</strong> Transactional email delivery.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Account Deletion &amp; Data Retention
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            Users can request deletion through Settings after confirming the request.
            Account-associated application data is removed from active systems as part
            of that process. Some information may remain temporarily in backups,
            security logs, email-provider records, or systems where retention is
            necessary for operational, security, or legal reasons.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Artificial Intelligence (AI) Status
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            MoneyTracker does not currently provide Claude or other AI-powered financial
            analysis features. If optional AI features are introduced in the future,
            MoneyTracker will provide a separate explanation of the information used
            and the user choices available.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Contact
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            If you have questions about your data or this page, you can reach out
            directly by email at{" "}
            <a
              href="mailto:founder@moneytracker.online"
              className="font-medium text-emerald-600 underline underline-offset-4 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              founder@moneytracker.online
            </a>
            .
          </p>
        </section>
      </div>
    </TrustPageShell>
  );
}
