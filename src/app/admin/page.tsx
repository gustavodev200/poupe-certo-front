"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDecidePriceReport,
  useDecideProduct,
  useModerationQueue,
} from "@/hooks/use-moderation";
import { categoryLabel } from "@/lib/categories";
import { formatAge } from "@/lib/trust";
import type { PendingPriceReport, PendingProduct } from "@/lib/api/moderation";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

function DecisionButtons({
  pending,
  onApprove,
  onReject,
}: {
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      <Button
        size="icon-sm"
        variant="outline"
        disabled={pending}
        onClick={onApprove}
        aria-label="Aprovar"
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant="destructive"
        disabled={pending}
        onClick={onReject}
        aria-label="Rejeitar"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

function ProductsSection({ products }: { products: PendingProduct[] }) {
  const decide = useDecideProduct();

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">
          Produtos pendentes ({products.length})
        </h2>
      </div>
      {products.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Nenhum produto pendente.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Mercado / preço</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.ean}>
                <TableCell>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.brand} · {p.ean}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {categoryLabel(p.category) ?? p.category}
                  </Badge>
                </TableCell>
                <TableCell>{p.qty}</TableCell>
                <TableCell>
                  {p.priceReport ? (
                    <>
                      <div>{p.priceReport.market.name}</div>
                      <div className="tabular-nums text-xs text-muted-foreground">
                        R$ {formatPrice(p.priceReport.price)}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sem preço
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatAge(p.createdAt)}
                </TableCell>
                <TableCell>
                  <DecisionButtons
                    pending={decide.isPending}
                    onApprove={() =>
                      decide.mutate({ ean: p.ean, decision: "approve" })
                    }
                    onReject={() =>
                      decide.mutate({ ean: p.ean, decision: "reject" })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function PriceReportsSection({ reports }: { reports: PendingPriceReport[] }) {
  const decide = useDecidePriceReport();

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">
          Preços pendentes ({reports.length})
        </h2>
      </div>
      {reports.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Nenhum preço pendente.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Mercado</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.product.name}</TableCell>
                <TableCell>{r.market.name}</TableCell>
                <TableCell className="tabular-nums">
                  R$ {formatPrice(r.price)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatAge(r.createdAt)}
                </TableCell>
                <TableCell>
                  <DecisionButtons
                    pending={decide.isPending}
                    onApprove={() =>
                      decide.mutate({ id: r.id, decision: "approve" })
                    }
                    onReject={() =>
                      decide.mutate({ id: r.id, decision: "reject" })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function AdminPage() {
  const queue = useModerationQueue();

  if (!queue.data) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold tracking-tight">Moderação</h1>
      <ProductsSection products={queue.data.products} />
      <PriceReportsSection reports={queue.data.priceReports} />
    </div>
  );
}
