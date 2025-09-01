import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Authentication Error</CardTitle>
            <CardDescription className="text-muted-foreground">
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {params?.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <p className="font-medium">Error: {params.error}</p>
                {params.error_description && <p className="mt-1 text-xs">{params.error_description}</p>}
              </div>
            )}
            <div className="text-sm text-muted-foreground text-center">
              <p>Please try signing in again or contact support if the problem persists.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/auth/login">Try Again</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/sign-up">Create New Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
