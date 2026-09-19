'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * The prototype's search box stored text in state that nothing ever read.
 * This one submits to /dashboard/search, which runs a real database query.
 */
export function SearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-3">
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search notes, PYQs, quizzes..."
        aria-label="Search study material"
      />
      <Button type="submit" size="icon" aria-label="Search">
        <Search />
      </Button>
    </form>
  );
}
