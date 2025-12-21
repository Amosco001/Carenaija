import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export default function Guidelines() {
  return (
    <div className="flex-1 bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb-guidelines">
            <Link href="/" className="hover:text-foreground" data-testid="link-guidelines-home">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/help" className="hover:text-foreground" data-testid="link-guidelines-help">Help Center</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground" data-testid="text-guidelines-current">Community Guidelines</span>
          </nav>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-guidelines-title">Community Guidelines</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
            <p className="text-slate-600">
              CareNaija exists to help Nigerians make informed healthcare decisions. Our community thrives when members share honest, helpful experiences that guide others to quality care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Review Guidelines</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Be honest and accurate:</strong> Share your genuine experience. Only review hospitals you have actually visited or worked at.</li>
              <li><strong>Be specific:</strong> Include details about the services received, wait times, staff interactions, and facility conditions.</li>
              <li><strong>Be respectful:</strong> Criticize services and practices, not individuals. Avoid personal attacks, threats, or discriminatory language.</li>
              <li><strong>Protect privacy:</strong> Do not share personal medical information about yourself or others. Avoid naming specific staff members unless giving positive recognition.</li>
              <li><strong>Stay relevant:</strong> Focus on healthcare experiences. Avoid off-topic content, spam, or promotional material.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">What We Don't Allow</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>False or misleading information</li>
              <li>Hate speech, harassment, or threats</li>
              <li>Content that violates patient or employee privacy</li>
              <li>Spam, advertisements, or promotional content</li>
              <li>Reviews written in exchange for payment or incentives</li>
              <li>Multiple accounts or fake identities</li>
              <li>Content that incites violence or illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">For Healthcare Workers</h2>
            <p className="text-slate-600">
              We welcome honest workplace reviews from current and former employees. Your insights help job seekers and improve healthcare standards across Nigeria. When sharing salary information or workplace experiences, ensure you are not violating any confidentiality agreements and focus on general workplace conditions rather than patient-specific information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Enforcement</h2>
            <p className="text-slate-600">
              Reviews that violate these guidelines may be removed. Repeated violations may result in account suspension. If you believe a review has been removed in error, please contact our support team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
