import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="flex-1 bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb-terms">
            <Link href="/" className="hover:text-foreground" data-testid="link-terms-home">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/help" className="hover:text-foreground" data-testid="link-terms-help">Help Center</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground" data-testid="text-terms-current">Terms of Service</span>
          </nav>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-terms-title">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Last updated: December 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-slate-600">
              Welcome to CareNaija. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600">
              By creating an account or using CareNaija, you agree to these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Services</h2>
            <p className="text-slate-600">
              CareNaija is a platform that enables users to discover, review, and rate healthcare facilities in Nigeria. We also allow healthcare workers to share workplace experiences and salary information. Our services are provided "as is" and we do not guarantee the accuracy of user-submitted content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. User Content</h2>
            <p className="text-slate-600 mb-4">
              When you submit reviews, ratings, or other content ("User Content"), you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Retain ownership of your content</li>
              <li>Grant us a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your content</li>
              <li>Represent that your content is accurate and based on genuine experiences</li>
              <li>Agree not to post content that violates our Community Guidelines</li>
              <li>Understand that your reviews are public and may be viewed by anyone</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Prohibited Conduct</h2>
            <p className="text-slate-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Post false, misleading, or defamatory content</li>
              <li>Harass, threaten, or intimidate other users</li>
              <li>Create multiple accounts or impersonate others</li>
              <li>Post reviews in exchange for payment or incentives</li>
              <li>Use automated systems to access or interact with our platform</li>
              <li>Attempt to bypass security measures or gain unauthorized access</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the proper functioning of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Hospital Profile Claims</h2>
            <p className="text-slate-600">
              Healthcare facilities may claim their profiles by providing appropriate verification. Claimed profiles may respond to reviews and update facility information. We reserve the right to verify claims and revoke claimed status if information is found to be inaccurate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-slate-600">
              CareNaija is provided "as is" without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, secure, or error-free. User reviews and ratings reflect individual opinions and experiences; we do not endorse or guarantee the accuracy of any user content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-slate-600">
              To the maximum extent permitted by law, CareNaija shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Indemnification</h2>
            <p className="text-slate-600">
              You agree to indemnify and hold harmless CareNaija, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Modifications to Terms</h2>
            <p className="text-slate-600">
              We may modify these Terms at any time. We will notify users of material changes by posting a notice on our platform. Your continued use of CareNaija after changes take effect constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-slate-600">
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Information</h2>
            <p className="text-slate-600">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-slate-600 mt-2">
              Email: <a href="mailto:legal@carenaija.com" className="text-primary hover:underline">legal@carenaija.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
