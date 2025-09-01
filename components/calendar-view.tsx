"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Todo {
  id: string
  title: string
  completed: boolean
  date: string
}

interface CalendarViewProps {
  userId: string
}

export function CalendarView({ userId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Get first day of current month and last day
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate()

  // Get previous month's last days to fill the grid
  const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
  const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => prevMonthLastDay - firstDayOfWeek + i + 1)

  // Get next month's first days to fill the grid
  const totalCells = 42 // 6 rows × 7 days
  const remainingCells = totalCells - firstDayOfWeek - daysInMonth
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  useEffect(() => {
    fetchTodos()
  }, [currentDate])

  const fetchTodos = async () => {
    setLoading(true)
    try {
      // Fetch todos for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split("T")[0]
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("todos")
        .select("id, title, completed, date")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error("Error fetching todos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTodosForDate = (date: string) => {
    return todos.filter((todo) => todo.date === date)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const formatDateForUrl = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return date.toISOString().split("T")[0]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Previous month days */}
          {prevMonthDays.map((day) => (
            <div key={`prev-${day}`} className="aspect-square p-1">
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 text-sm">
                {day}
              </div>
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateString = formatDateForUrl(day)
            const dayTodos = getTodosForDate(dateString)
            const completedTodos = dayTodos.filter((todo) => todo.completed).length
            const totalTodos = dayTodos.length

            return (
              <div key={day} className="aspect-square p-1">
                <Link href={`/day/${dateString}`} className="block w-full h-full">
                  <div
                    className={cn(
                      "w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer",
                      isToday(day) && "bg-primary text-primary-foreground hover:bg-primary hover:border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday(day) ? "text-primary-foreground" : "text-foreground",
                      )}
                    >
                      {day}
                    </span>
                    {totalTodos > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            completedTodos === totalTodos
                              ? "bg-green-500"
                              : completedTodos > 0
                                ? "bg-yellow-500"
                                : isToday(day)
                                  ? "bg-primary-foreground"
                                  : "bg-primary",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs",
                            isToday(day) ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {totalTodos}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}

          {/* Next month days */}
          {nextMonthDays.map((day) => (
            <div key={`next-${day}`} className="aspect-square p-1">
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 text-sm">
                {day}
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading todos...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
