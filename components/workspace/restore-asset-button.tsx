"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";

import { restoreAssetToDraft } from "@/app/(workspace)/workspace/content-library/actions";
import { Button } from "@/components/ui/button";

type RestoreAssetButtonProps = {
  assetId: number;
};

export function RestoreAssetButton({ assetId }: RestoreAssetButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleRestore() {
    if (
      !window.confirm(
        "להחזיר את הנכס לטיוטה? תוכלו להשתמש בו שוב במודעה חדשה."
      )
    ) {
      return;
    }

    setPending(true);
    try {
      await restoreAssetToDraft(assetId);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "ההחזרה לספרייה נכשלה"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleRestore}
      className="rounded-none text-xs font-light"
    >
      {pending ? (
        <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <RotateCcw className="ml-1.5 h-3.5 w-3.5" />
      )}
      החזר לשימוש חוזר
    </Button>
  );
}
