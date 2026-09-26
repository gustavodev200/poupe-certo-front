import { notFound } from "next/navigation";
import { AxiosError } from "axios";

import { getProductDetail } from "@/lib/api/products";
import { ProductView } from "./product-view";

export default async function ProductPage(props: PageProps<"/product/[ean]">) {
  const { ean } = await props.params;

  let product;
  try {
    product = await getProductDetail(ean);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  return <ProductView product={product} />;
}
