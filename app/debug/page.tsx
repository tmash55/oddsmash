import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DebugOddsDisplay from '../components/DebugOddsDisplay';

export default function DebugPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Odds API Debug Page</h1>
      
      <div className="flex mb-6 gap-4">
        <Link href="/debug">
          <Button variant="outline">Raw Odds Display</Button>
        </Link>
        <Link href="/debug/ev">
          <Button variant="outline">EV Calculation Debug</Button>
        </Link>
        <Link href="/debug/mlb">
          <Button variant="outline">MLB Debug</Button>
        </Link>
        <Link href="/debug/existing-api">
          <Button variant="outline">Existing API Debug</Button>
        </Link>
      </div>
      
      <DebugOddsDisplay />
    </div>
  );
} 