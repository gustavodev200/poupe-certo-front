"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Market } from "@/lib/api/markets";

export function MarketCombobox({
  id,
  markets,
  value,
  onChange,
  placeholder = "Busque um mercado",
}: Readonly<{
  id?: string;
  markets: Market[];
  value: string;
  onChange: (marketId: string) => void;
  placeholder?: string;
}>) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => markets.find((m) => m.id === value),
    [markets, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Digite pra buscar..." />
          <CommandList>
            <CommandEmpty>Nenhum mercado encontrado.</CommandEmpty>
            <CommandGroup>
              {markets.map((market) => (
                <CommandItem
                  key={market.id}
                  value={market.name}
                  onSelect={() => {
                    onChange(market.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === market.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {market.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
