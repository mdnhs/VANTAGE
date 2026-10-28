'use client';

import { useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { legalExtensions } from '@/lib/legal-pages/extensions';
import { cn } from '@/lib/utils';
import { isSafeHref, type TiptapDoc } from '@/validations/legal-page-schema';

// A bare domain ("dpc.ie") becomes an https link; anything else must already be a safe href.
function normaliseHref(value: string): string | null {
  const href = value.trim();
  if (!href) return null;
  if (isSafeHref(href)) return href;
  const withProtocol = `https://${href}`;
  return /^[\w-]+(\.[\w-]+)+/.test(href) && isSafeHref(withProtocol) ? withProtocol : null;
}

function ToolbarButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('size-8', active && 'bg-muted text-foreground')}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon className='size-4' />
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
      href: (e.getAttributes('link').href as string | undefined) ?? '',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const chain = () => editor.chain().focus();

  const applyLink = () => {
    if (!linkValue.trim()) {
      chain().extendMarkRange('link').unsetLink().run();
      setLinkOpen(false);
      return;
    }
    const href = normaliseHref(linkValue);
    if (!href) {
      setLinkError('Use a web address, mailto:, tel: or a site path like /contact.');
      return;
    }
    chain().extendMarkRange('link').setLink({ href }).run();
    setLinkOpen(false);
  };

  return (
    <div className='flex flex-col gap-2 border-b border-border p-2'>
      <div className='flex flex-wrap items-center gap-0.5'>
        <ToolbarButton
          icon={Heading2}
          label='Heading'
          active={state.h2}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={Heading3}
          label='Subheading'
          active={state.h3}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        />
        <span className='mx-1 h-5 w-px bg-border' />
        <ToolbarButton icon={Bold} label='Bold' active={state.bold} onClick={() => chain().toggleBold().run()} />
        <ToolbarButton
          icon={Italic}
          label='Italic'
          active={state.italic}
          onClick={() => chain().toggleItalic().run()}
        />
        <ToolbarButton
          icon={Underline}
          label='Underline'
          active={state.underline}
          onClick={() => chain().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={Link2}
          label='Link'
          active={state.link}
          onClick={() => {
            setLinkValue(state.href);
            setLinkError(null);
            setLinkOpen((open) => !open);
          }}
        />
        <span className='mx-1 h-5 w-px bg-border' />
        <ToolbarButton
          icon={List}
          label='Bulleted list'
          active={state.bulletList}
          onClick={() => chain().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label='Numbered list'
          active={state.orderedList}
          onClick={() => chain().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon={Quote}
          label='Quote'
          active={state.blockquote}
          onClick={() => chain().toggleBlockquote().run()}
        />
        <ToolbarButton icon={Minus} label='Divider' onClick={() => chain().setHorizontalRule().run()} />
        <span className='mx-1 h-5 w-px bg-border' />
        <ToolbarButton icon={Undo2} label='Undo' disabled={!state.canUndo} onClick={() => chain().undo().run()} />
        <ToolbarButton icon={Redo2} label='Redo' disabled={!state.canRedo} onClick={() => chain().redo().run()} />
      </div>
      {linkOpen && (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <Input
              autoFocus
              aria-label='Link address'
              placeholder='https://… , mailto:… or /contact'
              value={linkValue}
              onChange={(e) => {
                setLinkValue(e.target.value);
                setLinkError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === 'Escape') setLinkOpen(false);
              }}
              className='h-8'
            />
            <Button type='button' size='sm' onClick={applyLink}>
              {linkValue.trim() ? 'Apply' : 'Remove'}
            </Button>
          </div>
          {linkError && <p className='text-xs text-destructive'>{linkError}</p>}
        </div>
      )}
    </div>
  );
}

// Same extension set as the public renderer, so what the editor allows is what the page shows.
export function LegalPageEditor({
  initialContent,
  onChange,
}: {
  initialContent: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
}) {
  const editor = useEditor({
    extensions: legalExtensions,
    content: initialContent,
    // Rendered inside a client form; skipping the SSR pass avoids a hydration mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': 'Page content',
        class: cn(
          'min-h-[360px] px-4 py-3 text-sm leading-relaxed outline-none',
          '[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold',
          '[&_p]:my-2 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:my-4',
        ),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as TiptapDoc),
  });

  return (
    <div className='overflow-hidden rounded-lg border border-input bg-background focus-within:ring-[3px] focus-within:ring-ring/50'>
      {editor ? <Toolbar editor={editor} /> : <div className='h-12 border-b border-border' />}
      <EditorContent editor={editor} />
    </div>
  );
}
