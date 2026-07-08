import { useCallback, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { isSafeStoryLink, richTextExtensions } from '../lib/richTextEditor';
import { convertFileToWebP } from '../lib/imageProcessing';
import { uploadStoryImageBlob, type ImageVisibility } from '../lib/storyImages';

/** Applied to the ProseMirror contenteditable root for native browser spell check. */
const EDITOR_SPELLCHECK_ATTRS = {
  class: 'rich-editor__content',
  spellcheck: 'true',
  autocorrect: 'off',
  autocapitalize: 'off',
  lang: 'en',
} as const;

function applySpellcheckAttrs(dom: HTMLElement) {
  dom.spellcheck = true;
  dom.setAttribute('spellcheck', 'true');
  dom.setAttribute('autocorrect', 'off');
  dom.setAttribute('autocapitalize', 'off');
  dom.setAttribute('lang', 'en');
}

interface RichTextEditorProps {
  value: JSONContent;
  onChange: (json: JSONContent, html: string) => void;
  userId: string;
  disabled?: boolean;
  placeholder?: string;
  imageVisibility?: ImageVisibility;
}

export default function RichTextEditor({
  value,
  onChange,
  userId,
  disabled = false,
  placeholder = 'Write your story…',
  imageVisibility = 'draft',
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastSyncedRef = useRef('');

  const editor = useEditor({
    extensions: richTextExtensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      lastSyncedRef.current = JSON.stringify(json);
      onChangeRef.current(json, ed.getHTML());
    },
    editorProps: {
      attributes: EDITOR_SPELLCHECK_ATTRS,
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    applySpellcheckAttrs(editor.view.dom as HTMLElement);
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const fp = JSON.stringify(value);
    if (fp === lastSyncedRef.current) return;
    editor.commands.setContent(value, { emitUpdate: false });
    lastSyncedRef.current = fp;
  }, [editor, value]);

  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  const runSpellCheck = useCallback(() => {
    if (!editor || disabled) return;
    const dom = editor.view.dom as HTMLElement;
    applySpellcheckAttrs(dom);
    // Toggle spellcheck to nudge the browser to re-scan the document.
    dom.spellcheck = false;
    void dom.offsetHeight;
    dom.spellcheck = true;
    editor.chain().focus().run();
  }, [editor, disabled]);

  const uploadImage = useCallback(async (file: File) => {
    if (!editor) return;
    const blob = await convertFileToWebP(file);
    const url = await uploadStoryImageBlob(userId, blob, 'inline', imageVisibility);
    editor.chain().focus().setImage({ src: url, alt: file.name }).run();
  }, [editor, userId, imageVisibility]);

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
            if (!isSafeStoryLink(url)) {
              window.alert('Links must start with http:// or https://');
              return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
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
        <span className="rich-editor__toolbar-sep" aria-hidden="true" />
        <button
          type="button"
          className="rich-editor__btn rich-editor__btn--spell"
          onClick={runSpellCheck}
          disabled={disabled}
          aria-label="Check spelling"
          title="Check spelling — right-click a highlighted word for suggestions"
        >
          ABC<span className="rich-editor__spell-mark" aria-hidden="true">✓</span>
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
      <EditorContent
        editor={editor}
        spellCheck
        className="rich-editor__surface"
        aria-label="Story body"
      />
      {!editor.getText().trim() && (
        <div className="rich-editor__placeholder" aria-hidden="true">{placeholder}</div>
      )}
    </div>
  );
}