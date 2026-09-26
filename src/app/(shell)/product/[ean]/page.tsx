import { ProductView } from "./product-view";

export default async function ProductPage(props: PageProps<"/product/[ean]">) {
  const { ean } = await props.params;

  return <ProductView ean={ean} />;
}
