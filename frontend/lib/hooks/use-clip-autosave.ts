"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { saveClipDraft } from "@/lib/api/clips";
import { ClipDraftUpdate } from "@/lib/types/clip";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 1_000;

export function useClipAutosave(clipId: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pendingRef = useRef<ClipDraftUpdate | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const doSave = useCallback(
    async (payload: ClipDraftUpdate) => {
      setStatus("saving");
      try {
        await saveClipDraft(clipId, payload);
        setStatus("saved");
      } catch (err) {
        setStatus("error");
        throw err;
      } finally {
        inFlightRef.current = null;
      }
    },
    [clipId]
  );

  const debouncedSave = useDebouncedCallback((payload: ClipDraftUpdate) => {
    pendingRef.current = null;
    inFlightRef.current = doSave(payload).catch(() => {
      // status already set to error; caller can react via status
    });
  }, DEBOUNCE_MS);

  const save = useCallback(
    (payload: ClipDraftUpdate) => {
      pendingRef.current = { ...(pendingRef.current ?? {}), ...payload };
      setStatus("saving");
      debouncedSave(pendingRef.current);
    },
    [debouncedSave]
  );

  const flush = useCallback(async () => {
    debouncedSave.flush();
    if (inFlightRef.current) {
      await inFlightRef.current;
    }
  }, [debouncedSave]);

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  return { status, save, flush };
}
