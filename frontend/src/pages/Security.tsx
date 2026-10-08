import TrustPageShell from "../components/TrustPageShell";

export default function Security() {
  return (
    <TrustPageShell
      title="Security Overview"
      lastUpdated="October 8, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Overview
        </h2>
        <p>
          This page outlines the general technical safeguards and data handling
          practices implemented in MoneyTracker to protect user accounts and data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Account &amp; Authentication Safeguards
        </h2>
        <p>
          MoneyTracker uses account authentication, email verification, safeguards
          against repeated sensitive requests, and access controls intended to help
          protect accounts.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Data Protection in Transit
        </h2>
        <p>
          MoneyTracker is intended to be accessed through HTTPS connections. You
          should always confirm that your browser shows a secure connection before
          entering account information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Infrastructure &amp; Hosting Providers
        </h2>
        <p>
          Application services and databases are hosted on managed cloud infrastructure:
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
          Account Deletion Controls
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
          Security Limitations &amp; Responsible Reporting
        </h2>
        <p>
          No web-based application or transmission can be guaranteed completely
          immune to security threats. If you discover or suspect a potential security
          vulnerability in MoneyTracker, please report it directly to{" "}
          <a
            href="mailto:founder@moneytracker.online"
            className="font-medium text-teal-600 underline dark:text-teal-400"
          >
            founder@moneytracker.online
          </a>{" "}
          so it can be investigated promptly.
        </p>
      </section>
    </TrustPageShell>
  );
}
