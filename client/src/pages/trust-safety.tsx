import { Shield, Eye, Lock, AlertTriangle } from "lucide-react";

export default function TrustSafety() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-trust-safety-title">Trust & Safety</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-lg text-slate-600">
              At CareNaija, we are committed to maintaining a trustworthy platform where Nigerians can find reliable healthcare information. Here's how we protect our community.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6 not-prose">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <Shield className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Verified Reviews</h3>
              <p className="text-slate-600 text-sm">
                All reviews are tied to authenticated user accounts. We use multiple signals to detect and remove fake or incentivized reviews.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <Eye className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Content Moderation</h3>
              <p className="text-slate-600 text-sm">
                Our team reviews flagged content to ensure it meets our community guidelines. We use both automated tools and human review.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <Lock className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Data Protection</h3>
              <p className="text-slate-600 text-sm">
                We use industry-standard encryption to protect your personal information. Your data is never sold to third parties.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <AlertTriangle className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Report Concerns</h3>
              <p className="text-slate-600 text-sm">
                If you see content that violates our guidelines or seems suspicious, please report it. We investigate all reports promptly.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">How We Verify Hospital Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Hospital profiles are created from official registry data and public records</li>
              <li>Healthcare facilities can claim and verify their profiles with proper documentation</li>
              <li>Verified hospitals receive a badge indicating their claimed status</li>
              <li>We regularly update facility information to ensure accuracy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Protecting Employee Reviewers</h2>
            <p className="text-slate-600">
              We understand that healthcare workers may have concerns about sharing workplace experiences. Employee reviews can be posted anonymously, and we never share reviewer identities with employers. Salary information is aggregated and displayed without individual attribution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Report a Problem</h2>
            <p className="text-slate-600">
              If you encounter suspicious activity, inaccurate information, or content that violates our guidelines, please contact us at <a href="mailto:safety@carenaija.com" className="text-primary hover:underline">safety@carenaija.com</a>. We take all reports seriously and respond within 48 hours.
            </p>
          </section>
        </div>
      </div>
  );
}
