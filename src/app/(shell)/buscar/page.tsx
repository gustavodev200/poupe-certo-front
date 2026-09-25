import { ResultsView } from "./results-view";

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const category =
    typeof searchParams.categoria === "string"
      ? searchParams.categoria
      : undefined;

  return <ResultsView query={query} category={category} />;
}
