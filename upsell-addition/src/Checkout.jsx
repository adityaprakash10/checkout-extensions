import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';


import {
  useApi,
  useSettings,
  useApplyCartLinesChange,
  useApplyAttributeChange,
} from '@shopify/ui-extensions/checkout/preact';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const settings = useSettings();
  const { query } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const applyAttributeChange = useApplyAttributeChange();

  const [upsells, setUpsells] = useState([]);
  const [openProductId, setOpenProductId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const variantIds = [
    settings.upsell_variant_1,
    settings.upsell_variant_2,
    settings.upsell_variant_3,
  ].filter(Boolean);


  const discountPercent = settings.upsell_discount_percent ?? 0;


  useEffect(() => {
    if (!discountPercent) return;

    applyAttributeChange({
      type: 'updateAttribute',
      key: 'upsell_discount_percent',
      value: String(discountPercent),
    });
  }, [discountPercent]);



  useEffect(() => {
    if (!variantIds.length) return;

    (async () => {
      const result = await query(
        `
        query ($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on ProductVariant {
              product {
                id
                title
                images(first: 1) {
                  nodes { url }
                }
                variants(first: 50) {
                  nodes {
                    id
                    title
                    image {
                      url
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
        `,
        { variables: { ids: variantIds } }
      );

      const productMap = new Map();
      result.data.nodes.forEach((node) => {
        if (!productMap.has(node.product.id)) {
          productMap.set(node.product.id, node.product);
        }
      });

      setUpsells(Array.from(productMap.values()));
    })();
  }, [variantIds]);

  async function handleAddToCart() {
    if (!selectedVariantId) return;

    await applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: selectedVariantId,
      quantity: 1,
      attributes: [
        { key: 'upsell', value: 'true' },
      ],
    });

    setSelectedVariantId(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setOpenProductId(null);
  }

  function parseVariantTitle(title) {
    const parts = title.split(' / ');
    return {
      color: parts[0] || null,
      size: parts[1] || null,
    };
  }

  function findVariantByOptions(product, color, size) {
    if (!product || !color || !size) return null;

    return product.variants?.nodes?.find((variant) => {
      const parsed = parseVariantTitle(variant.title);
      return parsed.color === color && parsed.size === size;
    });
  }

  if (!upsells.length) {
    return <s-text>No upsell products configured</s-text>;
  }

  return (
    <>
      <s-stack >
      <s-stack paddingBlockEnd="small-300">
  <s-heading>
    You might also like ({discountPercent}% OFF)
  </s-heading>
</s-stack>

        {/* GUARANTEED ONE ROW */}
        <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="small">
          {upsells.map((product) => {
            const image = product.images?.nodes?.[0];

            return (
              <s-stack
                key={product.id}

                padding="none"
              >
                {image && (
                  <s-image
                    src={image.url}
                    alt={product.title}
                    inlineSize="112px"
                    aspectRatio="1/1"
                    borderRadius="base"
                    border="base"
                  />
                )}

                <s-stack paddingBlockEnd="small-300" paddingBlockStart='small-300'>
                  <s-text>{product.title}</s-text>
                </s-stack>


                <s-button
                  variant="auto"
                  command="--show"
                  commandFor="upsell-modal"
                  inlineSize="fill"
                  onClick={() => {
                    setOpenProductId(product.id);
                    setSelectedColor(null);
                    setSelectedSize(null);
                    setSelectedVariantId(null);
                  }}
                >
                  <s-text color="base" type="small" tone="info">Add</s-text>
                </s-button>
                
                
            </s-stack>
            );
          })}
        </s-grid>
      </s-stack>



      <s-modal
        id="upsell-modal"
        size="large"

        accessibilityLabel="Select variant"
      >
        {openProductId && (() => {
          const product = upsells.find(p => p.id === openProductId);
          if (!product) return null;

          const image = product.images?.nodes?.[0];
          const variants = product.variants?.nodes || [];


          const colors = [...new Set(variants.map(v => parseVariantTitle(v.title).color).filter(Boolean))];
          const sizes = [...new Set(variants.map(v => parseVariantTitle(v.title).size).filter(Boolean))];


          function getVariantImageForColor(color) {
            const variantWithColor = variants.find(v => {
              const parsed = parseVariantTitle(v.title);
              return parsed.color === color;
            });
            return variantWithColor?.image?.url || null;
          }


          const matchingVariant = selectedColor && selectedSize
            ? findVariantByOptions(product, selectedColor, selectedSize)
            : null;


          const displayVariant = matchingVariant || variants[0];

          return (
            <s-grid gridTemplateColumns="1fr 1.2fr" gap="large">
              <s-stack

              >
                {image && (
                  <s-image
                    src={image.url}
                    alt={product.title}
                    border="base"
                    borderRadius="large"
                  />
                )}
              </s-stack>

              <s-stack gap="base">
                <s-stack
                  paddingBlockEnd="base"
                  borderWidth="none none base none"

                >
                  <s-text >
                    {product.title}
                  </s-text>

                  {displayVariant && (
                    <s-text type="small" color="subdued">
                      ${displayVariant.price.amount}
                    </s-text>
                  )}
                </s-stack>



                <s-text>
                  Color: <s-text color="subdued">{selectedColor}</s-text>
                </s-text>
                <s-stack direction="inline" gap="base" alignItems='start'>
                  {colors.map((color) => {
                    const colorImage = getVariantImageForColor(color);
                    const isSelected = selectedColor === color;

                    const handleColorClick = () => {
                      setSelectedColor(color);
                      if (selectedSize) {
                        const variant = findVariantByOptions(product, color, selectedSize);
                        setSelectedVariantId(variant ? variant.id : null);
                      } else {
                        setSelectedVariantId(null);
                      }
                    };

                    return colorImage ? (
                      <s-clickable
                        key={color}
                        onClick={handleColorClick}
                        border={isSelected ? "base" : "none"}
                        padding="none"
                        accessibilityLabel={`Select color ${color}`}
                        inlineSize="80px"
                      >
                        <s-image
                          src={colorImage}
                          alt={color}
                          inlineSize="fill"
                          aspectRatio="1/1"
                        />
                      </s-clickable>
                    ) : (
                      <s-button
                        key={color}
                        variant={
                          isSelected
                            ? 'primary'
                            : 'secondary'
                        }
                        onClick={handleColorClick}
                      >
                        {color}
                      </s-button>
                    );
                  })}
                </s-stack>

                <s-text>Size : <s-text color="subdued">{selectedSize}</s-text></s-text>
                <s-stack direction="inline" gap="base">
                  {sizes.map((size) => (
                    <s-clickable
                      key={size}
                      border="base"
                      borderRadius="base"
                      padding="small"
                      onClick={() => {
                        setSelectedSize(size);
                        if (selectedColor) {
                          const variant = findVariantByOptions(product, selectedColor, size);
                          setSelectedVariantId(variant ? variant.id : null);
                        } else {
                          setSelectedVariantId(null);
                        }
                      }}
                    >
                      <s-text  color='subdued' type="small" tone="info">{size}</s-text>
                    </s-clickable>
                  ))}
                </s-stack>

                <s-clickable
                  slot="primary-action"
                  border="base"
                  borderRadius="base"
                  padding="small"
                  onClick={selectedVariantId ? handleAddToCart : undefined}
                >
                  <s-stack direction="inline" alignItems="center" justifyContent="center">
                    <s-text  color='subdued' type="small" tone="info">Select a size</s-text>
                  </s-stack>
                </s-clickable>
              </s-stack>
            </s-grid>
          );
        })()}
      </s-modal>



    </>
  );
}
