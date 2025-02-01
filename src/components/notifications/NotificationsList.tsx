import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, ChartLineUp, Wallet } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  date: string
  type: "goal" | "change" | "alert"
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "Net Worth Goal Reached",
    message: "Congratulations! You've reached your net worth goal of $50,000",
    date: "2024-03-20",
    type: "goal",
    read: false
  },
  {
    id: "2",
    title: "Significant Asset Value Change",
    message: "Your investment portfolio has increased by 10% this month",
    date: "2024-03-19",
    type: "change",
    read: false
  },
  {
    id: "3",
    title: "New Property Value Alert",
    message: "Your primary residence value has been updated",
    date: "2024-03-18",
    type: "alert",
    read: true
  }
]

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "goal":
      return <Bell className="h-5 w-5 text-green-500" />
    case "change":
      return <ChartLineUp className="h-5 w-5 text-blue-500" />
    case "alert":
      return <Wallet className="h-5 w-5 text-yellow-500" />
  }
}

export function NotificationsList({ showAll }: { showAll: boolean }) {
  const filteredNotifications = showAll
    ? notifications
    : notifications.filter(n => !n.read)

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.read ? "bg-background" : "bg-background-muted"
            }`}
          >
            <div className="flex gap-4">
              {getIcon(notification.type)}
              <div className="flex-1">
                <h3 className="font-medium">{notification.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}