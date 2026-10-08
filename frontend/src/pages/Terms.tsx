import TrustPageShell from "../components/TrustPageShell";

export default function Terms() {
  return (
    <TrustPageShell
      title="Terms of Use"
      lastUpdated="October 8, 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Overview
        </h2>
        <p>
          These Terms of Use describe the general conditions under which you may access
          and use MoneyTracker. By accessing or using the application, you agree to
          these terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Nature of the Service
        </h2>
        <p>
          MoneyTracker is a personal finance tracking and record-keeping tool. At the
          time this page was last updated, MoneyTracker does not connect directly to
          users’ bank accounts. Financial information is entered by the user into the
          application.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Not Financial, Legal, or Tax Advice
        </h2>
        <p>
          MoneyTracker is provided strictly for personal informational and organizational
          purposes. MoneyTracker does not provide financial, tax, accounting, legal, or
          investment advice. You are solely responsible for reviewing and verifying
          the accuracy of your financial records, balances, calculations, and financial
          decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          User Responsibilities
        </h2>
        <p>When using MoneyTracker, you agree to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Maintain the confidentiality of your account credentials.</li>
          <li>Provide a valid email address that you control for account verification.</li>
          <li>Use the application only for lawful personal finance tracking purposes.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Account Deletion & Ending Use
        </h2>
        <p>
          You may stop using MoneyTracker at any time. Users can request deletion
          through Settings after confirming the request. Account-associated
          application data is removed from active systems as part of that process.
          Some information may remain temporarily in backups, security logs,
          email-provider records, or systems where retention is necessary for
          operational, security, or legal reasons.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Service Availability
        </h2>
        <p>
          MoneyTracker is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo;
          basis without warranties of uninterrupted availability or error-free operation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Contact
        </h2>
        <p>
          Questions regarding these terms may be sent to{" "}
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
