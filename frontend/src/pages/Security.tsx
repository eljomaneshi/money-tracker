import TrustPageShell from "../components/TrustPageShell";

export default function Security() {
  return (
    <TrustPageShell
      title="Security Overview"
      lastUpdated="October 8, 2026"
    >
      <div className="space-y-8 divide-y divide-slate-200/80 dark:divide-white/10 [&>section:not(:first-child)]:pt-8">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Overview
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            This page outlines the general technical safeguards and data handling
            practices implemented in MoneyTracker to protect user accounts and data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Account &amp; Authentication Safeguards
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            MoneyTracker uses account authentication, email verification, safeguards
            against repeated sensitive requests, and access controls intended to help
            protect accounts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Data Protection in Transit
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            MoneyTracker is intended to be accessed through HTTPS connections. You
            should always confirm that your browser shows a secure connection before
            entering account information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Infrastructure &amp; Hosting Providers
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            Application services and databases are hosted on managed cloud infrastructure:
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
            Account Deletion Controls
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
            Security Limitations &amp; Responsible Reporting
          </h2>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            No web-based application or transmission can be guaranteed completely
            immune to security threats. If you discover or suspect a potential security
            vulnerability in MoneyTracker, please report it directly to{" "}
            <a
              href="mailto:founder@moneytracker.online"
              className="font-medium text-emerald-600 underline underline-offset-4 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              founder@moneytracker.online
            </a>{" "}
            so it can be investigated promptly.
          </p>
        </section>
      </div>
    </TrustPageShell>
  );
}
