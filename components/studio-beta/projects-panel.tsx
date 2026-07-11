"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import type { StudioBetaProject } from "@/db/schema";
import {
  listStudioBetaProjects,
  deleteStudioBetaProject,
} from "@/app/(ai-studio)/studio-beta/actions";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const STEP_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "העלאה",
  2: "רקע",
  3: "תמונה או וידאו",
  4: "שמירה",
};

export function ProjectsPanel() {
  const [projects, setProjects] = useState<StudioBetaProject[] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const hydrateFromProject = useStudioBetaStore((s) => s.hydrateFromProject);

  useEffect(() => {
    listStudioBetaProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteStudioBetaProject(id);
      setProjects((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    } finally {
      setDeletingId(null);
    }
  }

  if (projects === null) {
    return (
      <div className="flex items-center justify-center gap-2 border border-dashed border-border/60 py-10 text-xs font-light text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        טוען פרויקטים קודמים...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-border/60 px-6 py-10 text-center text-xs font-light text-muted-foreground">
        אין עדיין פרויקטים שמורים — הם יופיעו כאן אחרי שתתחילו לעבוד על תמונה
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          onClick={() => hydrateFromProject({ id: project.id, state: project.state })}
          className={cn(
            "group relative flex flex-col overflow-hidden border border-border/60 text-right transition-colors hover:border-gold",
            deletingId === project.id && "pointer-events-none opacity-50"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.thumbnailUrl ?? project.sourceImageUrl}
            alt={project.title}
            className="h-28 w-full object-cover"
          />
          <div className="space-y-0.5 p-2">
            <p className="truncate text-xs font-light">{project.title}</p>
            <p className="text-[11px] font-light text-muted-foreground">
              {STEP_LABEL[project.state.currentStep]} ·{" "}
              {dateFormatter.format(new Date(project.updatedAt))}
            </p>
          </div>
          <span
            role="button"
            tabIndex={0}
            aria-label="מחיקת פרויקט"
            onClick={(event) => {
              event.stopPropagation();
              void handleDelete(project.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                event.preventDefault();
                void handleDelete(project.id);
              }
            }}
            className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            {deletingId === project.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
