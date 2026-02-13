import { Button } from '@/components/ui/button';
import { QuickStartCTA } from './QuickStartCTA';

export function HeroSection() {
  const scrollToComparison = () => {
    const element = document.getElementById('comparison');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-20 px-4 text-center">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Formal Verification for AI-Generated Code
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          In autonomous software development, AI agents generate code at scale. But 96% of developers
          don't fully trust AI-generated code. Hapyy tools bring mathematical precision to AI workflows,
          transforming probabilistic outputs into provably correct software through formal verification
          and verified transpilation — the foundation of <em>vericoding</em>, where every transformation
          is guaranteed correct.
        </p>

        <div className="flex gap-4 justify-center pt-6">
          <QuickStartCTA size="lg" />
          <Button variant="outline" size="lg" onClick={scrollToComparison}>
            Explore Tools
          </Button>
        </div>
      </div>
    </section>
  );
}
