import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function BetslipNotFound() {
  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Betslip Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This betslip doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This could happen if:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>The betslip was deleted</li>
              <li>The link is incorrect</li>
              <li>You don&apos;t have access to view this betslip</li>
              <li>The betslip is private and you&apos;re not the owner</li>
            </ul>
          </div>
          <div className="pt-4 space-y-2">
            <Button asChild>
              <Link href="/betslip" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Betslip
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Or try the <Link href="/betslip-scanner" className="text-blue-600 hover:underline">Betslip Scanner</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 