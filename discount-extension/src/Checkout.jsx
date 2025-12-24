import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import {
  useTotalAmount,
  useDiscountCodes,
  useApplyDiscountCodeChange,
  useSettings,
} from '@shopify/ui-extensions/checkout/preact';
// Export the extension
export default async () => {
  render(<Extension />, document.body)
};
function Extension() {
  const totalAmount = useTotalAmount();
  const discountCodes = useDiscountCodes();
  const applyDiscountCodeChange = useApplyDiscountCodeChange();
  const settings = useSettings();
  // Get settings with defaults using useMemo to prevent re-creation
  const threshold = useMemo(() => {
    return Number(settings?.threshold) || 700;
  }, [settings?.threshold]);
  const discountCode = useMemo(() => {
    return settings?.discount_code || "TEST";
  }, [settings?.discount_code]);
  useEffect(() => {
    if (!totalAmount) return;
    const total = Number(totalAmount.amount);
    const isCodeApplied = discountCodes.some(
      (discount) => discount.code === discountCode
    );
    // Add discount code if threshold is met and code is not already applied
    if (total >= threshold && !isCodeApplied) {
      applyDiscountCodeChange({
        type: 'addDiscountCode',
        code: discountCode.toString(),
      });
    }
    // Remove discount code if total falls below threshold
    if (total < threshold && isCodeApplied) {
      applyDiscountCodeChange({
        type: 'removeDiscountCode',
        code: discountCode.toString(),
      });
    }
  }, [totalAmount, discountCodes, applyDiscountCodeChange, threshold, discountCode]);
  return (
    <s-text>
      {Number(totalAmount?.amount || 0) >= threshold
        ? `Congratulations! Discount code "${discountCode}" has been applied!`
        : `Add items worth $${threshold} to get free shipping with code "${discountCode}".`}
    </s-text>
  );
}







