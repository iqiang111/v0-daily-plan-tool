"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, CheckCircle, Circle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  date: string
  created_at: string
}

interface SearchResultsProps {
  userId: string
  initialQuery: string
}

export function SearchResults({ userId, initialQuery }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (initialQuery) {
      searchTodos(initialQuery)
    }
  }, [initialQuery])

  const searchTodos = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order("date", { ascending: false })

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error("Error searching todos:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchTodos(query)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const groupedResults = results.reduce(
    (acc, todo) => {
      if (!acc[todo.date]) {
        acc[todo.date] = []
      }
      acc[todo.date].push(todo)
      return acc
    },
    {} as Record<string, Todo[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Search Todos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search your todos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>

          {isLoading ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Searching your todos...</p>
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Found {results.length} todo{results.length !== 1 ? "s" : ""} matching "{query}"
                </p>
                {Object.entries(groupedResults).map(([date, todos]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-2 ml-7">
                      {todos.map((todo) => (
                        <Link key={todo.id} href={`/day/${todo.date}`}>
                          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {todo.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={cn(
                                      "font-medium",
                                      todo.completed && "line-through text-muted-foreground",
                                    )}
                                  >
                                    {highlightMatch(todo.title, query)}
                                  </h4>
                                  {todo.description && (
                                    <p
                                      className={cn(
                                        "text-sm text-muted-foreground mt-1",
                                        todo.completed && "line-through",
                                      )}
                                    >
                                      {highlightMatch(todo.description, query)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-lg mb-2">No todos found</h3>
                <p className="text-muted-foreground">
                  No todos found for "{query}". Try different keywords or check your spelling.
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Search Your Todos</h3>
              <p className="text-muted-foreground">Enter a search term above to find todos by title or description.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
