import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SearchResults } from "@/components/search-results"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SearchResults userId={user.id} initialQuery={q || ""} />
      </div>
    </div>
  )
}
