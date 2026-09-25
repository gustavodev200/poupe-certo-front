import { NewProductForm } from "./new-product-form";

export default async function NovoProdutoPage(
  props: PageProps<"/new-product">
) {
  const searchParams = await props.searchParams;
  const ean = typeof searchParams.ean === "string" ? searchParams.ean : "";

  return <NewProductForm ean={ean} />;
}
