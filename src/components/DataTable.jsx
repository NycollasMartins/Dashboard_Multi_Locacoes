import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

export default function DataTable({ columns, data, onAdd, addLabel = "Novo", searchPlaceholder = "Buscar...", onRowClick }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter(row =>
    columns.some(col => {
      const val = col.accessor ? (typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]) : "";
      return String(val || "").toLowerCase().includes(search.toLowerCase());
    })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="gap-2">
            <Plus className="w-4 h-4" /> {addLabel}
          </Button>
        )}
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map(col => (
                <TableHead key={col.key} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
            ) : filtered.map((row, i) => (
              <TableRow key={row.id || i} className={onRowClick ? "cursor-pointer" : ""} onClick={() => onRowClick?.(row)}>
                {columns.map(col => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : (typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}