import { 
  Shield, 
  Users, 
  CheckCircle2, 
  Building2, 
  Star, 
  Award, 
  Target, 
  Heart,
  Clock,
  FileCheck,
  BadgeCheck,
  MessageSquareText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTrustStats } from "@/hooks/useHospitals";
import { SEOHead } from "@/components/seo-head";

export default function About() {
  const { data: trustStats } = useTrustStats();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="About CareNaija - Nigeria's Trusted Hospital Review Platform"
        description="Learn about CareNaija's mission to help Nigerians find quality healthcare. We provide verified hospital reviews, ratings, and transparency in Nigerian healthcare."
        keywords="about CareNaija, Nigeria hospital reviews, healthcare transparency Nigeria, hospital ratings platform"
        canonicalUrl="https://www.carenaija.com/about"
      />
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-about-title">
            About CareNaija
          </h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Nigeria's trusted platform for finding quality healthcare and sharing honest experiences
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-600" />
              Our Mission
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              CareNaija was founded with a simple mission: to help Nigerians make informed healthcare decisions. 
              We believe everyone deserves access to honest, reliable information about hospitals and clinics 
              across the country. By connecting patients with real experiences and verified information, 
              we're working to improve healthcare transparency throughout Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-emerald-600" />
              Why CareNaija Matters
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-emerald-600 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">For Patients</h3>
                  <p className="text-slate-600 text-sm">
                    Find hospitals with verified reviews, compare care quality, 
                    and make confident healthcare choices for you and your family.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <Building2 className="h-8 w-8 text-emerald-600 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">For Healthcare Providers</h3>
                  <p className="text-slate-600 text-sm">
                    Claim your profile, respond to patient feedback, 
                    and showcase your commitment to quality care.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="bg-slate-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Our Verification Process
            </h2>
            <p className="text-slate-600 mb-6">
              We take trust seriously. Here's how we ensure the quality and authenticity of information on CareNaija:
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Hospital Verification</h3>
                  <p className="text-slate-600 text-sm">
                    Hospital information is compiled from official registries, public records, and submitted data. 
                    We verify details including location, services offered, and operational status. 
                    Hospitals can claim their profiles by providing official documentation proving their affiliation.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Verified Visit Reviews</h3>
                  <p className="text-slate-600 text-sm">
                    Reviews marked as "Verified Visit" come from users who have provided proof of their visit, 
                    such as receipts, appointment confirmations, or other documentation. 
                    These reviews carry a special badge to indicate higher trustworthiness.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Review Moderation</h3>
                  <p className="text-slate-600 text-sm">
                    Every review is checked for spam, inappropriate content, and authenticity. 
                    We use automated detection systems alongside human moderators to ensure 
                    reviews are genuine patient experiences, not promotional content or fake feedback.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MessageSquareText className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Hospital Responses</h3>
                  <p className="text-slate-600 text-sm">
                    Verified hospital representatives can respond to reviews, providing context 
                    and demonstrating their commitment to patient satisfaction. 
                    Only authorized personnel from claimed hospitals can post official responses.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-emerald-600" />
              CareNaija By The Numbers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-emerald-600">
                    {(trustStats?.totalHospitals || 180).toLocaleString()}+
                  </div>
                  <div className="text-sm text-slate-500">Hospitals Listed</div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-emerald-600">
                    {(trustStats?.totalReviews || 0).toLocaleString()}+
                  </div>
                  <div className="text-sm text-slate-500">Patient Reviews</div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-emerald-600">
                    {(trustStats?.verifiedHospitals || 0).toLocaleString()}+
                  </div>
                  <div className="text-sm text-slate-500">Verified Hospitals</div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-emerald-600">
                    {(trustStats?.activeUsersMonth || 0).toLocaleString()}+
                  </div>
                  <div className="text-sm text-slate-500">Monthly Users</div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              Our Commitment
            </h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Transparency:</strong> We clearly label verified vs. unverified information so you know what to trust.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Privacy:</strong> Your personal information is protected. Employee reviews can be anonymous to protect healthcare workers.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Independence:</strong> Reviews cannot be bought or removed by hospitals. Our ratings reflect genuine patient experiences.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span><strong>Continuous Improvement:</strong> We regularly update hospital information and add new features based on user feedback.</span>
              </li>
            </ul>
          </section>

          <section className="text-center bg-emerald-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Join Our Community</h2>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">
              Help improve healthcare for all Nigerians by sharing your experiences. 
              Every review contributes to a more transparent healthcare system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Write a Review
                </Button>
              </Link>
              <Link href="/suggest-hospital">
                <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-700">
                  Suggest a Hospital
                </Button>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-600" />
              Contact Us
            </h2>
            <p className="text-slate-600">
              Have questions, suggestions, or concerns? We'd love to hear from you.
            </p>
            <ul className="mt-4 space-y-2 text-slate-600">
              <li>Email: <a href="mailto:hello@carenaija.com" className="text-emerald-700 hover:underline">hello@carenaija.com</a></li>
              <li>Support: <a href="mailto:support@carenaija.com" className="text-emerald-700 hover:underline">support@carenaija.com</a></li>
              <li>For Hospitals: <a href="mailto:hospitals@carenaija.com" className="text-emerald-700 hover:underline">hospitals@carenaija.com</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
