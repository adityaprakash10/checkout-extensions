import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';
import {useCartLineTarget} from '@shopify/ui-extensions/checkout/preact';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const cartLine = useCartLineTarget();
  const [certification, setCertification] = useState(null);

  if (!cartLine) return null;

  const productId = cartLine.merchandise.product.id;

  useEffect(() => {
    (async () => {
      const result = await shopify.query(`
        query GetProductCertification($id: ID!) {
          product(id: $id) {
            metafield(namespace: "custom",
             key: "product_certification") {
              value
            }
          }
        }
      `, {
        variables: {id: productId},
      });

      setCertification(result?.data?.product?.metafield?.value ?? null);
    })();
  }, [productId]);

  if (!certification) return null;

  return <s-text>Certification: {certification}</s-text>;
}
