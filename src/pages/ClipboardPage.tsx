import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, ClipboardPaste, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClipboard } from "@/hooks/use-clipboard";

export function ClipboardPage() {
  const { t } = useTranslation();
  const { copy, paste, copied } = useClipboard();
  const [text, setText] = useState("Hello from TauriBase!");
  const [pastedText, setPastedText] = useState("");

  const handlePaste = async () => {
    const content = await paste();
    setPastedText(content);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("clipboard.title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("clipboard.copy")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to copy..."
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copy(text)}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? t("clipboard.copied") : t("clipboard.copy")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("clipboard.paste")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="gap-2" onClick={handlePaste}>
            <ClipboardPaste className="h-4 w-4" />
            {t("clipboard.paste")}
          </Button>
          {pastedText && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              {pastedText}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
