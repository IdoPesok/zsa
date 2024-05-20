"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { myFormDataAction } from "./actions"

export default function FormDataExample() {
  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Form Example</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={myFormDataAction} className="flex flex-col gap-4">
          <Input type="text" name="name" required placeholder="Enter name..." />
          <Input
            type="email"
            name="email"
            required
            placeholder="Enter email..."
          />
          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  )
}
