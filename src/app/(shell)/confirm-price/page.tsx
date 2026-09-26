import { notFound } from "next/navigation";
import { AxiosError } from "axios";

import { getProductDetail } from "@/lib/api/products";
import { ConfirmPriceForm } from "./confirm-price-form";

export default async function ConfirmarPrecoPage(
  props: PageProps<"/confirm-price">
) {
  const searchParams = await props.searchParams;
  const ean = typeof searchParams.ean === "string" ? searchParams.ean : "";

  if (!ean) {
    notFound();
  }

  let product;
  try {
    product = await getProductDetail(ean);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  return <ConfirmPriceForm product={product} />;
}
