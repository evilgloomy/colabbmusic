import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw } from 'lucide-react';
import { artistAgent } from '@/lib/artistAgent';

interface PremiumGateProps {
  onRefresh?: () => void;
}

export const PremiumGate = ({ onRefresh }: PremiumGateProps) => {
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingAnnual, setLoadingAnnual] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (isAnnual: boolean) => {
    const setLoading = isAnnual ? setLoadingAnnual : setLoadingMonthly;
    setLoading(true);
    setError('');

    try {
      const { data, error: checkoutErr } = await artistAgent.functions.invoke('create-checkout', {
        body: { isAnnual, tier: 'ultra' },
      });

      if (checkoutErr) throw checkoutErr;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Could not create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
        <Crown className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground font-display mb-2">
        Ultimate Plan Required
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Subscribe to the Ultimate plan to unlock unrestricted conversations with Cola B powered by ArtistAgent.AI.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <Button
          className="w-full"
          onClick={() => handleCheckout(false)}
          disabled={loadingMonthly || loadingAnnual}
        >
          {loadingMonthly ? 'Redirecting…' : 'Subscribe — $30/month'}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleCheckout(true)}
          disabled={loadingMonthly || loadingAnnual}
        >
          {loadingAnnual ? 'Redirecting…' : 'Annual — $288/year (Save 20%)'}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Already subscribed? Refresh
        </button>
      )}
    </div>
  );
};
