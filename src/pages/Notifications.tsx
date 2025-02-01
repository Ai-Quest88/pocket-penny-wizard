import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { NotificationsList } from "@/components/notifications/NotificationsList"
import { NotificationSettings } from "@/components/notifications/NotificationSettings"

export default function Notifications() {
  const [showAll, setShowAll] = useState(true)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Notifications</h1>
          <p className="text-text-muted">Stay informed about your financial goals and changes</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recent Notifications</h2>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-all"
                    checked={showAll}
                    onCheckedChange={setShowAll}
                  />
                  <Label htmlFor="show-all">Show All</Label>
                </div>
              </div>
              <NotificationsList showAll={showAll} />
            </Card>
          </div>
          <div>
            <NotificationSettings />
          </div>
        </div>
      </div>
    </div>
  )
}