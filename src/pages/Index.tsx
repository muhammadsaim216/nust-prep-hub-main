import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'NET-Style MCQs',
    description: 'Practice with questions designed exactly like the real NUST entrance test.',
  },
  {
    icon: Clock,
    title: 'Timed Mock Tests',
    description: 'Simulate real exam conditions with auto-submission and negative marking.',
  },
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Track your progress and identify weak areas with comprehensive insights.',
  },
  {
    icon: CheckCircle2,
    title: 'All NUST Fields',
    description: 'Engineering, Computing, Architecture, Business & Social Sciences covered.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow mb-8 animate-float">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>

            <h1 className="text-4xl lg:text-6xl font-display font-bold mb-6">
              Ace Your{' '}
              <span className="text-gradient-primary">NUST NET</span>
              {' '}Exam
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The most comprehensive preparation platform for Pakistan's National University of Sciences and Technology entrance test. Practice MCQs, take mock tests, and track your progress.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-gradient-primary hover:opacity-90 shadow-glow">
                <Link to="/auth">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Preparing Free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link to="/auth">
                  Login
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Join thousands of students preparing for NUST NET
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform is designed specifically for NUST NET preparation with features that help you study smarter, not harder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container pb-20">
        <Card className="border-0 shadow-xl bg-gradient-hero text-primary-foreground overflow-hidden">
          <CardContent className="py-12 px-8 text-center relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-bold mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Create your free account today and join thousands of students already preparing for NUST NET.
              </p>
              <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base bg-white text-primary hover:bg-white/90">
                <Link to="/auth">
                  Get Started Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 NUST NET Prep. Built for Pakistani students.</p>
        </div>
      </footer>
    </div>
  );
}
