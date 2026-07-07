import { useCallback, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { richTextExtensions } from '../lib/richText';
import { convertFileToWebP } from '../lib/imageProcessing';
import { uploadStoryImageBlob } from '../lib/storyImages';

interface RichTextEditorProps {
  value: JSONContent;
  onChange: (json: JSONContent, html: string) => void;
  userId: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  userId,
  disabled = false,
  placeholder = 'Write your story…',
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: richTextExtensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getJSON(), ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor__content',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const uploadImage = useCallback(async (file: File) => {
    if (!editor) return;
    const blob = await convertFileToWebP(file);
    const url = await uploadStoryImageBlob(userId, blob, 'inline');
    editor.chain().focus().setImage({ src: url, alt: file.name }).run();
  }, [editor, userId]);

  if (!editor) return <div className="rich-editor rich-editor--loading">Loading editor…</div>;

  return (
    <div className={`rich-editor ${disabled ? 'rich-editor--disabled' : ''}`}>
      <div className="rich-editor__toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`rich-editor__btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        >
          H2
        </button>
        <button
          type="button"
          className="rich-editor__btn"
          onClick={() => {
            const prev = editor.getAttributes('link').href as string | undefined;
            const url = window.prompt('Link URL', prev ?? 'https://');
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
          disabled={disabled}
        >
          Link
        </button>
        <button
          type="button"
          className="rich-editor__btn"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled}
        >
          Image
        </button>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="file-input-hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            await uploadImage(file);
          } catch {
            window.alert('Image upload failed. Try again.');
          }
        }}
      />
      <EditorContent editor={editor} />
      {!editor.getText().trim() && (
        <div className="rich-editor__placeholder" aria-hidden="true">{placeholder}</div>
      )}
    </div>
  );
}