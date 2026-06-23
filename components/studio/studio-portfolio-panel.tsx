"use client";

import * as React from "react";
import Image from "next/image";
import {
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  deleteStudioProject,
  renameStudioProject,
  type StudioProjectListItem,
} from "@/app/(ai-studio)/studio/project-actions";
import { snapshotModeLabel, snapshotStatusLabel } from "@/lib/studio-project-snapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StudioPortfolioPanelProps = {
  projects: StudioProjectListItem[];
  activeProjectId: number | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelect: (id: number) => void;
  onNewProject: () => void;
  showToast: (message: string) => void;
};

export function StudioPortfolioPanel({
  projects,
  activeProjectId,
  loading,
  onRefresh,
  onSelect,
  onNewProject,
  showToast,
}: StudioPortfolioPanelProps) {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [busyId, setBusyId] = React.useState<number | null>(null);

  async function handleRename(id: number) {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    setBusyId(id);
    try {
      await renameStudioProject(id, trimmed);
      setEditingId(null);
      await onRefresh();
      showToast("שם העבודה עודכן");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "עדכון השם נכשל");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (
      !window.confirm(
        `למחוק את «${title}»? לא ניתן לשחזר את העבודה לאחר מחיקה.`
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      await deleteStudioProject(id);
      await onRefresh();
      showToast("העבודה נמחקה");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "המחיקה נכשלה");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="rounded-none border-border/60 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
          תיק עבודות
        </CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onNewProject}
          className="rounded-none text-xs font-light"
        >
          <Plus className="ml-1.5 h-3.5 w-3.5" />
          עבודה חדשה
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-light text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            טוען עבודות...
          </div>
        ) : projects.length === 0 ? (
          <p className="py-6 text-center text-xs font-light text-muted-foreground">
            אין עבודות שמורות עדיין. העלו צילום או לחצו «עבודה חדשה» — כל ניסיון
            יישמר אוטומטית.
          </p>
        ) : (
          <ul className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;
              const isEditing = editingId === project.id;
              const isBusy = busyId === project.id;

              return (
                <li
                  key={project.id}
                  className={`border p-3 transition-colors ${
                    isActive
                      ? "border-gold/60 bg-gold/5"
                      : "border-border/50 hover:border-gold/30"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border/40 bg-stone-100">
                      {project.thumbnailUrl ? (
                        <Image
                          src={project.thumbnailUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <FolderOpen className="h-5 w-5" strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8 rounded-none text-xs"
                            dir="rtl"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                void handleRename(project.id);
                              }
                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleRename(project.id)}
                            className="h-8 rounded-none text-xs"
                          >
                            שמור
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelect(project.id)}
                          className="block w-full truncate text-right text-sm font-light text-foreground hover:text-gold-dark"
                        >
                          {project.title}
                        </button>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-light text-muted-foreground">
                        <span className="text-foreground/70">
                          {snapshotModeLabel(project.mode)}
                        </span>
                        <span>·</span>
                        <span
                          className={
                            project.status === "published"
                              ? "text-emerald-700"
                              : project.status === "ready"
                                ? "text-gold-dark"
                                : undefined
                          }
                        >
                          {snapshotStatusLabel(project.status)}
                        </span>
                        <span>·</span>
                        <span>
                          {new Intl.DateTimeFormat("he-IL", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(project.updatedAt))}
                        </span>
                      </div>

                      {!isEditing && (
                        <div className="flex gap-1 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingId(project.id);
                              setEditTitle(project.title);
                            }}
                            className="h-7 rounded-none px-2 text-[10px] font-light"
                          >
                            <Pencil className="ml-1 h-3 w-3" />
                            שם
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => onSelect(project.id)}
                            className="h-7 rounded-none px-2 text-[10px] font-light"
                          >
                            <FolderOpen className="ml-1 h-3 w-3" />
                            פתיחה
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleDelete(project.id, project.title)}
                            className="h-7 rounded-none px-2 text-[10px] font-light text-destructive hover:text-destructive"
                          >
                            {isBusy ? (
                              <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="ml-1 h-3 w-3" />
                            )}
                            מחיקה
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
