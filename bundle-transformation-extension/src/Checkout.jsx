import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import {
  useCartLines,
  useSubtotalAmount,
  useApplyCartLinesChange,
  useSettings,
} from '@shopify/ui-extensions/checkout/preact';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const cartLines = useCartLines();
  const subtotal = useSubtotalAmount();
  const applyCartLinesChange = useApplyCartLinesChange();
  const settings = useSettings();

  
  const tiers = [
    {
      threshold: Number(settings.tier1_threshold ?? 0),
      variantId: settings.tier1_variant,
    },
    {
      threshold: Number(settings.tier2_threshold ?? 0),
      variantId: settings.tier2_variant,
    },
    {
      threshold: Number(settings.tier3_threshold ?? 0),
      variantId: settings.tier3_variant,
    },
  ].filter(t => t.threshold && t.variantId);

  const isApplyingRef = useRef(false);
  
    useEffect(() => {
    if (!subtotal || isApplyingRef.current) return;

    const cartSubtotal = Number(subtotal.amount);
    const activeTier = tiers
      .filter(t => cartSubtotal >= t.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0];
      

    const freeGiftLine = cartLines.find(
      line =>
        line.attributes.some(
          attr => attr.key === '_free_gift' && attr.value === 'true'
        )
    );
    if (!activeTier && freeGiftLine) {
      applyCartLinesChange({
        type: 'removeCartLine',
        id: freeGiftLine.id,
        quantity: freeGiftLine.quantity,
      });
      return;
    }
    if (
      activeTier &&
      freeGiftLine &&
      freeGiftLine.merchandise.id === activeTier.variantId
    ) {
      return;
    }
    if (activeTier && !isApplyingRef.current) {
      isApplyingRef.current = true;

      const changes = [];

      if (freeGiftLine) {
        changes.push(
          applyCartLinesChange({
            type: 'removeCartLine',
            id: freeGiftLine.id,
            quantity: freeGiftLine.quantity,
          })
        );
      }

      changes.push(
        applyCartLinesChange({
          type: 'addCartLine',
          merchandiseId: String(activeTier.variantId),
          quantity: 1,
          attributes: [{ key: '_free_gift', value: 'true' }],
        })
      );

      Promise.all(changes).finally(() => {
        isApplyingRef.current = false;
      });
    }
  }, [subtotal, cartLines, tiers]);

  return (
    <s-text>
      Free gift applied when eligible

    </s-text>
  );
}
