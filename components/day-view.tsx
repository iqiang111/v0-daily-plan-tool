"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Trash2, Edit3 } from "lucide-react"
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

interface DayViewProps {
  date: string
  userId: string
}

export function DayView({ date, userId }: DayViewProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTodo, setNewTodo] = useState({ title: "", description: "" })

  const supabase = createClient()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    fetchTodos()
  }, [date])

  const fetchTodos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .order("created_at", { ascending: true })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error("Error fetching todos:", error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async () => {
    if (!newTodo.title.trim()) return

    try {
      const { data, error } = await supabase
        .from("todos")
        .insert({
          title: newTodo.title.trim(),
          description: newTodo.description.trim() || null,
          date,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      setTodos((prev) => [...prev, data])
      setNewTodo({ title: "", description: "" })
      setIsAdding(false)
    } catch (error) {
      console.error("Error adding todo:", error)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("todos").update({ completed }).eq("id", id)

      if (error) throw error

      setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed } : todo)))
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", id)

      if (error) throw error

      setTodos((prev) => prev.filter((todo) => todo.id !== id))
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  const updateTodo = async (id: string, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from("todos")
        .update({
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq("id", id)

      if (error) throw error

      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, title: title.trim(), description: description.trim() || null } : todo,
        ),
      )
      setEditingId(null)
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length

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
          <CardTitle className="text-2xl font-bold">{formatDate(date)}</CardTitle>
          {totalCount > 0 && (
            <p className="text-muted-foreground">
              {completedCount} of {totalCount} tasks completed
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading todos...</p>
          ) : (
            <>
              {todos.length === 0 && !isAdding && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No tasks for this day yet.</p>
                  <Button onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Task
                  </Button>
                </div>
              )}

              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  onToggle={(completed) => toggleTodo(todo.id, completed)}
                  onDelete={() => deleteTodo(todo.id)}
                  onEdit={() => setEditingId(todo.id)}
                  onSave={(title, description) => updateTodo(todo.id, title, description)}
                  onCancel={() => setEditingId(null)}
                />
              ))}

              {isAdding && (
                <Card className="border-dashed border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Input
                        placeholder="Task title"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo((prev) => ({ ...prev, title: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            addTodo()
                          }
                        }}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={newTodo.description}
                        onChange={(e) => setNewTodo((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button onClick={addTodo} disabled={!newTodo.title.trim()}>
                          Add Task
                        </Button>
                        <Button variant="outline" onClick={() => setIsAdding(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {todos.length > 0 && !isAdding && (
                <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Task
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  isEditing: boolean
  onToggle: (completed: boolean) => void
  onDelete: () => void
  onEdit: () => void
  onSave: (title: string, description: string) => void
  onCancel: () => void
}

function TodoItem({ todo, isEditing, onToggle, onDelete, onEdit, onSave, onCancel }: TodoItemProps) {
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDescription, setEditDescription] = useState(todo.description || "")

  const handleSave = () => {
    if (editTitle.trim()) {
      onSave(editTitle, editDescription)
    }
  }

  if (isEditing) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editTitle.trim()}>
                Save
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("transition-all", todo.completed && "opacity-75")}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Checkbox checked={todo.completed} onCheckedChange={onToggle} className="mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-medium", todo.completed && "line-through text-muted-foreground")}>{todo.title}</h3>
            {todo.description && (
              <p className={cn("text-sm text-muted-foreground mt-1", todo.completed && "line-through")}>
                {todo.description}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
