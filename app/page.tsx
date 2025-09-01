import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CalendarView } from "@/components/calendar-view"
import { SearchBar } from "@/components/search-bar"

export default async function HomePage() {
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
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Daily Planner</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {user.email}</p>
            </div>
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign Out
              </button>
            </form>
          </div>
          <div className="mt-6">
            <SearchBar userId={user.id} />
          </div>
        </header>
        <CalendarView userId={user.id} />
      </div>
    </div>
  )
}
