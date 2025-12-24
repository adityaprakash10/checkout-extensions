import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {

  if (!input.discount.discountClasses.includes(DiscountClass.Product)) {
    return { operations: [] };
  }
  const rawPercent = Number(input.cart.attribute?.value ?? 0);
  const discountPercent =
    rawPercent > 0 && rawPercent <= 100 ? rawPercent : 0;

  if (discountPercent === 0) {
    return { operations: [] };
  }
  const upsellLines = input.cart.lines.filter((line: any) => {
    const upsellAttr = (line as any).upsellAttribute ?? line.attribute;
    return upsellAttr?.value === 'true';
  });

  if (!upsellLines.length) {
    return { operations: [] };
  }


  const candidates = upsellLines.map((line: any) => {
    const bundleAttr = (line as any).bundleAttribute;
    const isBundle = bundleAttr?.value === 'true';
    const finalDiscountPercent = isBundle ? 75 : discountPercent;

    return {
      message: `${finalDiscountPercent}% OFF`,
      targets: [{ cartLine: { id: line.id } }],
      value: {
        percentage: { value: finalDiscountPercent },
      },
    };
  });

  return {
    operations: [
      {
        productDiscountsAdd: {
          selectionStrategy: ProductDiscountSelectionStrategy.All,
          candidates,
        },
      },
    ],
  };
}
