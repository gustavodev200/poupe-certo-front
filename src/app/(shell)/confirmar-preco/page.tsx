import { notFound } from "next/navigation";

import { getProductByEan } from "@/lib/mock/catalog";
import { ConfirmPriceForm } from "./confirm-price-form";

export default async function ConfirmarPrecoPage(
  props: PageProps<"/confirmar-preco">
) {
  const searchParams = await props.searchParams;
  const ean = typeof searchParams.ean === "string" ? searchParams.ean : "";
  const product = getProductByEan(ean);

  if (!product) {
    notFound();
  }

  return <ConfirmPriceForm product={product} />;
}
