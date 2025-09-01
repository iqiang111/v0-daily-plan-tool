"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Calendar, CheckCircle, Circle } from "lucide-react"
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

interface SearchBarProps {
  userId: string
}

export function SearchBar({ userId }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTodos = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      setIsOpen(true)

      try {
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", userId)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order("date", { ascending: false })
          .limit(10)

        if (error) throw error
        setResults(data || [])
      } catch (error) {
        console.error("Error searching todos:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchTodos, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, userId, supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("en-US", {
      month: "short",
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
        <mark key={index} className="bg-primary/20 text-primary-foreground px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery("")
    inputRef.current?.blur()
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search your todos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-border">
                {results.map((todo) => (
                  <Link
                    key={todo.id}
                    href={`/day/${todo.date}`}
                    onClick={handleResultClick}
                    className="block p-4 hover:bg-muted/50 transition-colors"
                  >
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
                          className={cn("font-medium text-sm", todo.completed && "line-through text-muted-foreground")}
                        >
                          {highlightMatch(todo.title, query)}
                        </h4>
                        {todo.description && (
                          <p
                            className={cn(
                              "text-xs text-muted-foreground mt-1 line-clamp-2",
                              todo.completed && "line-through",
                            )}
                          >
                            {highlightMatch(todo.description, query)}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(todo.date)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No todos found for "{query}"</p>
                <p className="text-xs mt-1">Try different keywords or check your spelling</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
