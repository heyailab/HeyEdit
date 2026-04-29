import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotification } from "@/hooks/use-notification";

export function NotificationsPage() {
  const { t } = useTranslation();
  const { notify } = useNotification();

  const handleTestNotification = () => {
    notify(t("notifications.test_title"), t("notifications.test_body"));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("notifications.title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("notifications.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleTestNotification}
          >
            <Bell className="h-4 w-4" />
            {t("notifications.test")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
