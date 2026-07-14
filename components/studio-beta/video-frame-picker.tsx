"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * לפני שממשיכים עם וידאו שהועלה, נותנים למשתמש לבחור פריים ספציפי
 * מתוכו (לא תמיד השנייה הראשונה) — משתמשים בבקרות הנגן הרגילות
 * (scrubbing) ולוקחים את currentTime בזמן האישור.
 */
export function VideoFramePicker({
  videoUrl,
  onConfirm,
  onCancel,
}: {
  videoUrl: string;
  onConfirm: (frameOffsetSec: number) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedSec, setSelectedSec] = useState(0);

  return (
    <div className="space-y-3">
      <p className="text-xs font-light text-muted-foreground">
        גררו את סרגל הנגן לפריים הרצוי, ואז אשרו אותו כתמונת הבסיס לעבודה
      </p>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        playsInline
        className="max-h-[420px] w-full border border-border/60"
        onTimeUpdate={(event) =>
          setSelectedSec(event.currentTarget.currentTime)
        }
        onLoadedMetadata={(event) =>
          setSelectedSec(event.currentTarget.currentTime)
        }
      />
      <p className="text-xs font-light tabular-nums text-muted-foreground">
        פריים נבחר: {selectedSec.toFixed(1)} שנ&apos;
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => onConfirm(videoRef.current?.currentTime ?? 0)}
          className="flex-1 rounded-none text-xs tracking-[0.1em]"
        >
          <ImagePlus className="ml-2 h-4 w-4" strokeWidth={1.5} />
          אשר פריים זה והמשך
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-none text-xs tracking-[0.1em]"
        >
          ביטול
        </Button>
      </div>
    </div>
  );
}
