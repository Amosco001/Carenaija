export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: December 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-slate-600">
              CareNaija ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
            <h3 className="font-medium mb-2">Personal Information</h3>
            <p className="text-slate-600 mb-4">
              When you create an account, we may collect:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Name and email address</li>
              <li>Profile information you choose to provide</li>
              <li>Reviews and ratings you submit</li>
              <li>Information provided when claiming a hospital profile</li>
            </ul>

            <h3 className="font-medium mb-2 mt-4">Automatically Collected Information</h3>
            <p className="text-slate-600 mb-4">
              When you use our platform, we may automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-slate-600 mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Provide and maintain our services</li>
              <li>Process and display your reviews</li>
              <li>Verify hospital profile claims</li>
              <li>Send important updates about our services</li>
              <li>Improve our platform and user experience</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Information Sharing</h2>
            <p className="text-slate-600 mb-4">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li><strong>Service Providers:</strong> Third parties who help us operate our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="text-slate-600 mt-4">
              Your reviews are public and visible to all users. Salary information from employee reviews is aggregated and displayed without individual attribution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Data Security</h2>
            <p className="text-slate-600">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
            <p className="text-slate-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-slate-600 mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@carenaija.com" className="text-primary hover:underline">privacy@carenaija.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <p className="text-slate-600">
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-slate-600">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-slate-600">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-slate-600">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-slate-600 mt-2">
              Email: <a href="mailto:privacy@carenaija.com" className="text-primary hover:underline">privacy@carenaija.com</a>
            </p>
          </section>
        </div>
      </div>
  );
}
