import { notFound } from "next/navigation";

import { getProductByEan } from "@/lib/mock/catalog";
import { ProductView } from "./product-view";

export default async function ProductPage(props: PageProps<"/produto/[ean]">) {
  const { ean } = await props.params;
  const product = getProductByEan(ean);

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}
