import { Link } from "wouter";
import { Mail, MessageSquare, HelpCircle, ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

export default function Support() {
  return (
    <div className="flex-1 bg-background">
      <SEOHead 
        title="Contact Support - Get Help with CareNaija"
        description="Need help with CareNaija? Contact our support team for assistance with hospital reviews, account issues, or general inquiries."
        keywords="CareNaija support, help desk Nigeria, hospital review help"
        canonicalUrl="https://www.carenaija.com/support"
      />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb-support">
            <Link href="/" className="hover:text-foreground" data-testid="link-support-home">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/help" className="hover:text-foreground" data-testid="link-support-help">Help Center</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground" data-testid="text-support-current">Contact Support</span>
          </nav>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-support-title">Contact Support</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-lg text-slate-600">
              We're here to help you get the most out of CareNaija. Find answers to common questions or reach out to our support team.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <Mail className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Email Support</h3>
              <p className="text-slate-600 text-sm mb-4">
                Send us an email and we'll respond within 24-48 hours.
              </p>
              <a href="mailto:support@carenaija.com" className="text-primary hover:underline text-sm font-medium">
                support@carenaija.com
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <MessageSquare className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Feedback</h3>
              <p className="text-slate-600 text-sm mb-4">
                Have suggestions to improve CareNaija? We'd love to hear from you.
              </p>
              <a href="mailto:feedback@carenaija.com" className="text-primary hover:underline text-sm font-medium">
                feedback@carenaija.com
              </a>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">How do I write a review?</h3>
                <p className="text-slate-600">
                  Sign in to your account, search for the hospital you visited, and click "Write a Review" on their profile page. You can share your experience as a patient or as a healthcare worker.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-2">Can I edit or delete my review?</h3>
                <p className="text-slate-600">
                  Yes, you can edit or delete your reviews at any time by going to your profile and selecting the review you wish to modify.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-2">How do I claim a hospital profile?</h3>
                <p className="text-slate-600">
                  If you're a hospital administrator or owner, visit the hospital's profile page and click "Claim This Profile." You'll need to provide verification documents to confirm your association with the facility.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-2">Why was my review removed?</h3>
                <p className="text-slate-600">
                  Reviews may be removed if they violate our Community Guidelines. Common reasons include personal attacks, false information, or off-topic content. Contact us if you believe your review was removed in error.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-2">How can I suggest a hospital to be added?</h3>
                <p className="text-slate-600">
                  If you can't find a hospital in our directory, you can suggest it for addition by clicking "Suggest a Hospital" on the search page. Provide as much information as possible and we'll review your submission.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-2">Is my personal information safe?</h3>
                <p className="text-slate-600">
                  Yes. We use industry-standard security measures to protect your data. We never sell your personal information to third parties. See our Privacy Policy for details.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
