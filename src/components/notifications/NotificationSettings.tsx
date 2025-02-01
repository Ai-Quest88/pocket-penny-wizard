import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    netWorthAlerts: true,
    goalNotifications: true,
    netWorthThreshold: "1000"
  })

  const handleSave = () => {
    // Save notification settings
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">Email Notifications</Label>
          <Switch
            id="email-notifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailNotifications: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="net-worth-alerts">Net Worth Change Alerts</Label>
          <Switch
            id="net-worth-alerts"
            checked={settings.netWorthAlerts}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, netWorthAlerts: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="goal-notifications">Goal Achievement Notifications</Label>
          <Switch
            id="goal-notifications"
            checked={settings.goalNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, goalNotifications: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">Net Worth Change Threshold ($)</Label>
          <Input
            id="threshold"
            type="number"
            value={settings.netWorthThreshold}
            onChange={(e) =>
              setSettings({ ...settings, netWorthThreshold: e.target.value })
            }
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </Card>
  )
}