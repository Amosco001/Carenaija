import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  Search, 
  ChevronRight, 
  HelpCircle, 
  Star, 
  Building2, 
  Shield, 
  User, 
  Mail, 
  MessageSquare,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Play,
  ExternalLink,
  Send
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/seo-head";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "using-1",
    question: "How do I search for a hospital?",
    answer: "Use the search bar on the homepage or go to 'Find Hospitals' in the navigation. You can search by hospital name, location (state or city), or specialty. Filter results by rating, ownership type, or services offered.",
    category: "using"
  },
  {
    id: "using-2",
    question: "How do I create an account?",
    answer: "Click 'Sign up' in the top right corner of the page. We use secure authentication through Replit, which means you can sign up with your existing account. Your information is protected and never shared.",
    category: "using"
  },
  {
    id: "using-3",
    question: "Can I compare hospitals?",
    answer: "Yes! When viewing hospital listings, click the 'Compare' button on any hospital card to add it to your comparison list. You can compare up to 4 hospitals side-by-side, viewing ratings, services, and reviews together.",
    category: "using"
  },
  {
    id: "using-4",
    question: "How do I save a hospital for later?",
    answer: "When logged in, you can bookmark hospitals by clicking the bookmark icon on any hospital card or profile page. Access your saved hospitals from your dashboard.",
    category: "using"
  },
  {
    id: "using-5",
    question: "What information is shown on hospital profiles?",
    answer: "Hospital profiles include basic information (address, phone, hours), services offered, patient and employee reviews, ratings across multiple categories, photos, and verification status.",
    category: "using"
  },
  {
    id: "reviews-1",
    question: "How do I write a review?",
    answer: "Sign in to your account, find the hospital you visited, and click 'Write a Review' on their profile page. Choose whether you're reviewing as a patient or healthcare worker, then share your honest experience.",
    category: "reviews"
  },
  {
    id: "reviews-2",
    question: "Can I write anonymous reviews?",
    answer: "Yes, all reviews are anonymous by default. Your display name is shown, but not your real identity. Employee reviews are especially protected to ensure workplace safety.",
    category: "reviews"
  },
  {
    id: "reviews-3",
    question: "Can I edit or delete my review?",
    answer: "Yes, you can edit or delete your reviews at any time. Go to your dashboard, find the review you want to modify, and click 'Edit' or 'Delete'. Deleted reviews cannot be recovered.",
    category: "reviews"
  },
  {
    id: "reviews-4",
    question: "What makes a helpful review?",
    answer: "A helpful review is specific, honest, and balanced. Describe your actual experience, mention specific staff interactions, wait times, cleanliness, and treatment quality. Avoid vague statements and personal attacks.",
    category: "reviews"
  },
  {
    id: "reviews-5",
    question: "Why was my review removed?",
    answer: "Reviews may be removed if they violate our Community Guidelines. Common reasons include: personal attacks on individuals, false or defamatory statements, off-topic content, promotional material, or reviews from people who haven't visited the facility.",
    category: "reviews"
  },
  {
    id: "reviews-6",
    question: "How are ratings calculated?",
    answer: "Overall ratings are calculated from multiple categories including quality of care, cleanliness, wait time, staff attitude, and facilities. Each category is weighted equally. The displayed rating is an average of all verified reviews.",
    category: "reviews"
  },
  {
    id: "hospitals-1",
    question: "How do I claim my hospital's profile?",
    answer: "If you're a hospital administrator or owner, visit your hospital's profile and click 'Claim This Profile'. You'll need to verify your identity and association with the facility. Our team will review and approve verified claims.",
    category: "hospitals"
  },
  {
    id: "hospitals-2",
    question: "What can I do with a claimed profile?",
    answer: "With a claimed profile, you can: update hospital information (hours, services, contact details), respond to patient reviews, upload photos, add staff credentials, and access analytics about your profile views and ratings.",
    category: "hospitals"
  },
  {
    id: "hospitals-3",
    question: "How do I respond to negative reviews?",
    answer: "We encourage professional, empathetic responses. Acknowledge the patient's experience, apologize for any shortcomings, and explain steps taken to address concerns. Never reveal patient information or become defensive.",
    category: "hospitals"
  },
  {
    id: "hospitals-4",
    question: "Can I suggest a new hospital to be added?",
    answer: "Yes! If a hospital isn't in our directory, click 'Suggest a Hospital' in the navigation. Provide the hospital's name, address, and any other details you know. Our team will verify and add approved hospitals.",
    category: "hospitals"
  },
  {
    id: "hospitals-5",
    question: "How does verification work for hospitals?",
    answer: "Verified hospitals have confirmed their information through our verification process. This includes confirming ownership, validating contact information, and ensuring listed services are accurate. Look for the verification badge on profiles.",
    category: "hospitals"
  },
  {
    id: "account-1",
    question: "How is my personal information protected?",
    answer: "We use industry-standard encryption and security measures. Your personal data is never sold to third parties. We only collect information necessary to provide our services. See our Privacy Policy for complete details.",
    category: "account"
  },
  {
    id: "account-2",
    question: "Can I delete my account?",
    answer: "Yes, you can request account deletion by contacting our support team. Note that deleting your account will also remove all your reviews and saved data permanently.",
    category: "account"
  },
  {
    id: "account-3",
    question: "What data do you collect?",
    answer: "We collect: account information (name, email), reviews you submit, hospitals you save or compare, and usage analytics. We do not collect sensitive health information. Full details are in our Privacy Policy.",
    category: "account"
  },
  {
    id: "account-4",
    question: "How do I change my profile information?",
    answer: "Go to your dashboard and click on your profile section. You can update your display name and other preferences. Some information may be managed through your Replit account.",
    category: "account"
  },
  {
    id: "account-5",
    question: "Who can see my activity?",
    answer: "Your public profile shows only your display name and reviews. Other users cannot see your saved hospitals, comparisons, or personal information. You control what's visible in your privacy settings.",
    category: "account"
  }
];

const categories = [
  { id: "using", name: "Using CareNaija", icon: HelpCircle, description: "Getting started and navigating the platform" },
  { id: "reviews", name: "Writing Reviews", icon: Star, description: "How to share your healthcare experiences" },
  { id: "hospitals", name: "For Hospitals", icon: Building2, description: "Managing your hospital profile" },
  { id: "account", name: "Account & Privacy", icon: Shield, description: "Your data and security" }
];

const videoTutorials = [
  { id: "1", title: "Getting Started with CareNaija", duration: "2:30", thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=225&fit=crop" },
  { id: "2", title: "How to Write a Helpful Review", duration: "3:45", thumbnail: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=225&fit=crop" },
  { id: "3", title: "Comparing Hospitals", duration: "1:50", thumbnail: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=225&fit=crop" }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const filteredFAQs = useMemo(() => {
    let result = faqData;
    
    if (activeCategory) {
      result = result.filter(faq => faq.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [searchQuery, activeCategory]);

  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach(faq => {
      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFAQs]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24-48 hours."
    });
    
    setContactForm({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="flex-1 bg-background">
      <SEOHead 
        title="Help Center - FAQs & Support"
        description="Find answers to frequently asked questions about using CareNaija. Learn how to search hospitals, write reviews, claim hospital profiles, and more."
        keywords="CareNaija help, FAQ Nigeria hospitals, hospital review help, support center"
        canonicalUrl="https://www.carenaija.com/help"
      />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb-help-center">
            <Link href="/" className="hover:text-foreground" data-testid="link-help-home">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground" data-testid="text-help-current">Help Center</span>
          </nav>
        </div>
      </div>

      <div className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-help-title">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
          
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
              data-testid="input-faq-search"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(isActive ? null : category.id)}
                className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                  isActive 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-card hover:border-primary/50"
                }`}
                data-testid={`button-category-${category.id}`}
              >
                <Icon className={`h-8 w-8 mb-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </button>
            );
          })}
        </div>

        {activeCategory && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing:</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              {categories.find(c => c.id === activeCategory)?.name}
              <button 
                onClick={() => setActiveCategory(null)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                data-testid="button-clear-category"
              >
                ×
              </button>
            </span>
          </div>
        )}

        <Tabs defaultValue="faq" className="space-y-8">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 gap-2">
            <TabsTrigger value="faq" data-testid="tab-faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="guides" data-testid="tab-guides">
              <BookOpen className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">
              <Play className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">
              <Mail className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-8">
            {filteredFAQs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or browse all categories
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                    data-testid="button-clear-search"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedFAQs).map(([categoryId, faqs]) => {
                const category = categories.find(c => c.id === categoryId);
                if (!category) return null;
                const Icon = category.icon;
                
                return (
                  <div key={categoryId}>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold">{category.name}</h2>
                      <span className="bg-muted px-2 py-0.5 rounded text-sm text-muted-foreground">
                        {faqs.length} {faqs.length === 1 ? "question" : "questions"}
                      </span>
                    </div>
                    
                    <Accordion type="single" collapsible className="space-y-2">
                      {faqs.map((faq) => (
                        <AccordionItem 
                          key={faq.id} 
                          value={faq.id}
                          className="border rounded-lg px-4 bg-card"
                          data-testid={`accordion-item-${faq.id}`}
                        >
                          <AccordionTrigger 
                            className="text-left hover:no-underline py-4"
                            data-testid={`accordion-trigger-${faq.id}`}
                          >
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="guides" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>How to Write a Helpful Review</CardTitle>
                      <CardDescription>Tips for sharing your healthcare experience</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Be Specific</h4>
                      <p className="text-sm text-muted-foreground">Describe your actual experience with details about staff, wait times, and treatment quality.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Stay Balanced</h4>
                      <p className="text-sm text-muted-foreground">Mention both positives and areas for improvement to help others make informed decisions.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Be Honest</h4>
                      <p className="text-sm text-muted-foreground">Share your genuine experience. Fake or exaggerated reviews harm the community.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Avoid Personal Attacks</h4>
                      <p className="text-sm text-muted-foreground">Focus on the experience, not individuals. Reviews with personal attacks will be removed.</p>
                    </div>
                  </div>
                  <Link href="/guidelines">
                    <Button variant="outline" className="w-full mt-4" data-testid="link-review-guidelines">
                      Read Full Guidelines
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-500/5">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle>How Verification Works</CardTitle>
                      <CardDescription>Understanding our trust and verification system</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      Verified Hospitals
                    </h4>
                    <p className="text-sm text-muted-foreground">Hospitals with verified badges have confirmed their ownership and information accuracy through our verification process.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      Verified Reviewers
                    </h4>
                    <p className="text-sm text-muted-foreground">Reviews from verified users who have confirmed their identity carry more weight in our rating system.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-purple-600" />
                      </div>
                      Claiming a Profile
                    </h4>
                    <p className="text-sm text-muted-foreground">Hospital administrators can claim their profile by providing verification documents. This enables them to manage their listing and respond to reviews.</p>
                  </div>
                  <Link href="/trust-safety">
                    <Button variant="outline" className="w-full mt-4" data-testid="link-trust-safety">
                      Learn About Trust & Safety
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/privacy-policy">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid="link-privacy-policy">
                  <CardContent className="flex items-center gap-4 py-6">
                    <Shield className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">Privacy Policy</h3>
                      <p className="text-sm text-muted-foreground">How we collect, use, and protect your data</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/terms-of-service">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid="link-terms-of-service">
                  <CardContent className="flex items-center gap-4 py-6">
                    <BookOpen className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">Terms of Service</h3>
                      <p className="text-sm text-muted-foreground">Rules and guidelines for using CareNaija</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Video Tutorials</h2>
              <p className="text-muted-foreground">Learn how to get the most out of CareNaija</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {videoTutorials.map((video) => (
                <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" data-testid={`video-card-${video.id}`}>
                  <div className="relative aspect-video bg-muted">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-medium">{video.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-muted/50">
              <CardContent className="py-8 text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">More tutorials coming soon!</h3>
                <p className="text-muted-foreground">
                  We're creating more video content to help you navigate CareNaija.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
                  <p className="text-muted-foreground">
                    Can't find what you're looking for? Send us a message and we'll get back to you within 24-48 hours.
                  </p>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input
                      id="contact-subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="How can we help?"
                      required
                      data-testid="input-contact-subject"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Tell us more about your question or issue..."
                      rows={5}
                      required
                      data-testid="input-contact-message"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-contact">
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Us Directly
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">General Support</p>
                      <a href="mailto:support@carenaija.com" className="text-primary hover:underline font-medium" data-testid="link-email-support">
                        support@carenaija.com
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hospital Partnerships</p>
                      <a href="mailto:hospitals@carenaija.com" className="text-primary hover:underline font-medium" data-testid="link-email-hospitals">
                        hospitals@carenaija.com
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Feedback & Suggestions</p>
                      <a href="mailto:feedback@carenaija.com" className="text-primary hover:underline font-medium" data-testid="link-email-feedback">
                        feedback@carenaija.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We typically respond to all inquiries within <strong>24-48 hours</strong> during business days. For urgent matters related to hospital verification, please email hospitals@carenaija.com.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
