import { ToolButton } from "@/components/RichEditorToolbar";
import { IconImage, IconVideo } from "@/components/icons";
import { insertMediaFiles } from "@/lib/kbMedia";
import type { Editor } from "@tiptap/react";
import { useRef } from "react";

export function KbMediaControl({ editor }: { editor: Editor }) {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    await insertMediaFiles(editor, [...list]);
  }

  return (
    <>
      <ToolButton
        label="Ubaci sliku"
        onClick={() => imageRef.current?.click()}
      >
        <IconImage className="size-4" />
      </ToolButton>
      <ToolButton
        label="Ubaci video"
        onClick={() => videoRef.current?.click()}
      >
        <IconVideo className="size-4" />
      </ToolButton>
      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(event) => {
          void onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(event) => {
          void onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </>
  );
}
