import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

export const PremiumGate = () => (
  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
      <Crown className="w-8 h-8 text-primary" />
    </div>
    <h2 className="text-xl font-semibold text-foreground font-sora mb-2">Premium Feature</h2>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
      Upgrade your subscription to unlock unlimited conversations with Cola B.
    </p>
    <Button asChild>
      <a href="https://www.artistagent.ai/pricing" target="_blank" rel="noopener noreferrer">
        Upgrade on ArtistAgent.AI
      </a>
    </Button>
  </div>
);
