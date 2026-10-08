"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PatientSearchFilter({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/patients?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/patients");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Filter by name, phone, or MRN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>
      <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white">
        Search
      </Button>
    </form>
  );
}
