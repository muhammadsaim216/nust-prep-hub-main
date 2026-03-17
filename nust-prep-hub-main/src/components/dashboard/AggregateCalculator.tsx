import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, GraduationCap, BookOpen, Target } from 'lucide-react';

function CircularGauge({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return 'hsl(var(--success))';
    if (percentage >= 60) return 'hsl(var(--secondary))';
    if (percentage >= 40) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-display font-bold text-foreground">
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground font-medium">/ {max}</span>
      </div>
    </div>
  );
}

export function AggregateCalculator() {
  const [matric, setMatric] = useState('');
  const [hssc, setHssc] = useState('');
  const [net, setNet] = useState('');

  const matricMarks = Math.min(Math.max(parseFloat(matric) || 0, 0), 100);
  const hsscMarks = Math.min(Math.max(parseFloat(hssc) || 0, 0), 100);
  const netMarks = Math.min(Math.max(parseFloat(net) || 0, 0), 200);

  const matricWeighted = (matricMarks / 100) * 10;
  const hsscWeighted = (hsscMarks / 100) * 15;
  const netWeighted = (netMarks / 200) * 75;
  const totalAggregate = matricWeighted + hsscWeighted + netWeighted;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          NUST Aggregate Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-primary" />
                Matric / O-Level (10%)
              </Label>
              <Input
                type="number"
                placeholder="Percentage (0-100)"
                value={matric}
                onChange={(e) => setMatric(e.target.value)}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Weighted: {matricWeighted.toFixed(2)} / 10
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-secondary" />
                HSSC / A-Level (15%)
              </Label>
              <Input
                type="number"
                placeholder="Percentage (0-100)"
                value={hssc}
                onChange={(e) => setHssc(e.target.value)}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Weighted: {hsscWeighted.toFixed(2)} / 15
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-accent" />
                NET Score (75%)
              </Label>
              <Input
                type="number"
                placeholder="Marks (0-200)"
                value={net}
                onChange={(e) => setNet(e.target.value)}
                min={0}
                max={200}
              />
              <p className="text-xs text-muted-foreground">
                Weighted: {netWeighted.toFixed(2)} / 75
              </p>
            </div>
          </div>

          {/* Gauge */}
          <div className="flex flex-col items-center justify-center gap-3">
            <CircularGauge value={totalAggregate} />
            <p className="text-sm font-medium text-muted-foreground">Total NUST Aggregate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
