export const metadata = {
  title: "Privacy Policy | Nexon Digital Nova",
  description: "Privacy policy for Nexon Digital Nova and its services.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 8, 2026</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Who We Are</h2>
          <p>
            Nexon Digital Nova LLC (&quot;Nexon&quot;, &quot;we&quot;, &quot;us&quot;) is a technology company
            registered in Mongolia (Registration No. 7250777). We provide AI-powered
            messaging automation services for businesses via Facebook Messenger and
            Instagram. Our website is{" "}
            <a href="https://nexon-digital-nova.com" className="text-blue-600 underline">
              https://nexon-digital-nova.com
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account information:</strong> Name, email address, and password
              (hashed) when you register.
            </li>
            <li>
              <strong>Facebook Page data:</strong> Page name, Page ID, and access
              tokens when you connect your Facebook Business Page.
            </li>
            <li>
              <strong>Instagram account data:</strong> Instagram account ID and
              username when you connect your Instagram account.
            </li>
            <li>
              <strong>Message logs:</strong> Incoming and outgoing messages processed
              through our bot on your connected pages. These are stored to provide
              conversation history.
            </li>
            <li>
              <strong>Payment information:</strong> Transaction records for credit
              purchases. We do not store card details — payments are processed by QPay.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide automated message reply services on your Facebook/Instagram pages.</li>
            <li>To display conversation history in your dashboard.</li>
            <li>To process payments and manage your credit balance.</li>
            <li>To send you service-related notifications (e.g. low credit alerts).</li>
            <li>We do not sell your data to third parties.</li>
            <li>We do not use your data for advertising purposes.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Facebook Platform Data</h2>
          <p>
            When you connect your Facebook Business Page, we request the following
            permissions:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <code>pages_messaging</code> — to send and receive messages on your behalf
            </li>
            <li>
              <code>pages_show_list</code> — to list your Facebook Pages
            </li>
            <li>
              <code>pages_read_engagement</code> — to read page engagement data
            </li>
            <li>
              <code>instagram_basic</code> — to access your connected Instagram account
            </li>
            <li>
              <code>instagram_manage_messages</code> — to send and receive Instagram messages
            </li>
          </ul>
          <p className="mt-3">
            We only use these permissions to operate the bot on your behalf. We do not
            read or store messages beyond what is necessary to provide the service.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request
            deletion of your account and all associated data at any time by contacting
            us. Message logs are retained for up to 90 days by default.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Data Deletion</h2>
          <p>
            To request deletion of your data, contact us at{" "}
            <a href="mailto:nexondigitalnova@gmail.com" className="text-blue-600 underline">
              nexondigitalnova@gmail.com
            </a>
            . We will process your request within 30 days. If you connected via
            Facebook, you can also revoke access directly from your Facebook Settings →
            Apps and Websites.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Security</h2>
          <p>
            We use industry-standard security practices including encrypted connections
            (HTTPS), hashed passwords, and secure token storage. Access to your data is
            restricted to authorized personnel only.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Third-Party Services</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Meta (Facebook/Instagram)</strong> — for messaging platform
              integration
            </li>
            <li>
              <strong>QPay</strong> — for payment processing
            </li>
            <li>
              <strong>OpenAI</strong> — for AI-powered bot responses
            </li>
            <li>
              <strong>Neon</strong> — for database hosting
            </li>
            <li>
              <strong>Vercel</strong> — for application hosting
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or your data, contact us at:
          </p>
          <ul className="list-none mt-2 space-y-1">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:nexondigitalnova@gmail.com" className="text-blue-600 underline">
                nexondigitalnova@gmail.com
              </a>
            </li>
            <li>
              <strong>Phone:</strong> +976 86185769
            </li>
            <li>
              <strong>Address:</strong> Улаанбаатар, Баянзүрх, 18-р хороо, 13-р
              хороолол, 10 байр 59 тоот, Mongolia
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
