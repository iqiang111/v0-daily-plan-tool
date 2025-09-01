import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DayView } from "@/components/day-view"

interface DayPageProps {
  params: Promise<{ date: string }>
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <DayView date={date} userId={user.id} />
      </div>
    </div>
  )
}
