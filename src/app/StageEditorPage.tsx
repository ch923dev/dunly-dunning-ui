import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { api, fetchCampaign, type CampaignStep } from '../lib/api'
import { Field, inputClass } from '../components/AuthShell'

const MERGE_VARS = [
  'customer_name',
  'company_name',
  'amount_due',
  'plan_name',
  'update_payment_link',
] as const

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`

function ToolbarButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault() /* keep editor focus */}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-[13px] font-semibold transition-colors ${
        active ? 'bg-brand-tint text-brand-ink' : 'text-ink-soft hover:bg-line-soft'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL (https://… or a {{merge_var}})', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line-soft px-2 py-1.5">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-extrabold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        ••
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
        ↗
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <select
        aria-label="Insert merge variable"
        value=""
        onChange={(e) => {
          if (!e.target.value) return
          editor.chain().focus().insertContent(`{{${e.target.value}}}`).run()
          e.target.value = ''
        }}
        className="h-8 rounded-md border border-line bg-card px-2 font-mono text-[12px] text-ink-soft"
      >
        <option value="">{'{{ variable }}'}</option>
        {MERGE_VARS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  )
}

function PreviewPane({
  stage,
  subject,
  bodyHtml,
}: {
  stage: number | 'reactivation'
  subject?: string
  bodyHtml?: string | null
}) {
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [stale, setStale] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setStale(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const body: Record<string, unknown> = { stage }
        if (subject !== undefined && subject.trim() !== '') body.subject = subject
        if (stage !== 'reactivation' && bodyHtml !== undefined) body.bodyHtml = bodyHtml
        const result = await api<{ subject: string; html: string }>('/api/preview', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        setPreview(result)
      } finally {
        setStale(false)
      }
    }, 500)
    return () => clearTimeout(timer.current)
  }, [stage, subject, bodyHtml])

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
      <div className="border-b border-line-soft px-4 py-3">
        <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
          Live preview {stale && '· rendering…'}
        </p>
        <p className="mt-1 truncate text-[14px] font-semibold text-ink">
          {preview?.subject ?? '…'}
        </p>
        <p className="text-[12px] text-ink-mute">with sample customer data</p>
      </div>
      {preview ? (
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={preview.html}
          className="h-[640px] w-full bg-white"
        />
      ) : (
        <div className="grid h-[640px] place-items-center">
          <p className="font-mono text-sm text-ink-faint">Rendering…</p>
        </div>
      )}
    </div>
  )
}

function TestSendButton({ stage }: { stage: number | 'reactivation' }) {
  const mutation = useMutation({
    mutationFn: () =>
      api<{ sent: boolean; to: string }>('/api/test-send', {
        method: 'POST',
        body: JSON.stringify({ stage }),
      }),
  })
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-60"
      >
        {mutation.isPending ? 'Sending…' : 'Send test email'}
      </button>
      {mutation.isSuccess && (
        <span className="text-[12px] font-semibold text-brand">→ {mutation.data.to} ✓</span>
      )}
      {mutation.isError && (
        <span className="text-[12px] font-semibold text-rose">{mutation.error.message}</span>
      )}
    </span>
  )
}

/** Saved-content editor for one campaign step. Mounted with key=step.id. */
function StepEditor({ step }: { step: CampaignStep }) {
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState(step.subject)
  const [bodyDraft, setBodyDraft] = useState<string | null>(step.bodyHtml)
  const [delayHours, setDelayHours] = useState(step.delayHours)
  const [limitWindow, setLimitWindow] = useState(step.sendWindowStart !== null)
  const [windowStart, setWindowStart] = useState(step.sendWindowStart ?? 9)
  const [windowEnd, setWindowEnd] = useState(step.sendWindowEnd ?? 18)
  const [skipBelow, setSkipBelow] = useState(step.skipIfAmountBelow)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: step.bodyHtml ?? '',
    onUpdate: ({ editor }) => {
      setBodyDraft(editor.getText().trim() === '' ? null : editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'tiptap-body px-3.5 py-3 text-[15px] text-ink-soft' },
    },
  })

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])

  const save = useMutation({
    mutationFn: () =>
      api<CampaignStep>(`/api/campaign/steps/${step.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subject,
          bodyHtml: bodyDraft,
          delayHours,
          sendWindowStart: limitWindow ? windowStart : null,
          sendWindowEnd: limitWindow ? windowEnd : null,
          skipIfAmountBelow: skipBelow,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign'] })
      setError(null)
      setSaved(true)
    },
    onError: (err) => setError(err.message),
  })

  const reset = useMutation({
    mutationFn: () => api<CampaignStep>(`/api/campaign/steps/${step.id}/reset`, { method: 'POST' }),
    onSuccess: (fresh) => {
      queryClient.invalidateQueries({ queryKey: ['campaign'] })
      setSubject(fresh.subject)
      setBodyDraft(null)
      editor?.commands.setContent('')
      setError(null)
      setSaved(true)
    },
    onError: (err) => setError(err.message),
  })

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(400px,1fr)_minmax(420px,560px)]">
      <div className="space-y-5">
        {error && (
          <p className="rounded-lg bg-rose-tint px-3.5 py-2.5 text-[13px] font-medium text-rose">
            {error}
          </p>
        )}

        <Field label="Subject">
          <input
            type="text"
            value={subject}
            maxLength={200}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Body</span>
          <div className="rounded-lg border border-line bg-card transition-colors focus-within:border-brand">
            {editor && <Toolbar editor={editor} />}
            <EditorContent editor={editor} />
          </div>
          <p className="mt-1.5 text-[12px] text-ink-mute">
            {bodyDraft === null
              ? 'Empty = the built-in template for this stage (shown in the preview). Start typing to replace it.'
              : 'Custom body — the unsubscribe & manage-subscription footer stays attached automatically.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Delay after failure (hours)">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={8760}
                value={delayHours}
                onChange={(e) => setDelayHours(Math.max(0, Number(e.target.value) || 0))}
                className={`${inputClass} w-28`}
              />
              <span className="font-mono text-[12px] text-ink-mute">
                ≈ Day {Math.round(delayHours / 24)}
              </span>
            </div>
          </Field>
          <Field label="Skip when amount due is below (minor units, e.g. cents)">
            <input
              type="number"
              min={0}
              placeholder="never skip"
              value={skipBelow ?? ''}
              onChange={(e) => setSkipBelow(e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={limitWindow}
              onChange={(e) => setLimitWindow(e.target.checked)}
              className="h-4 w-4 accent-(--color-brand)"
            />
            Only send during certain hours (workspace timezone)
          </label>
          {limitWindow && (
            <div className="mt-2.5 flex items-center gap-2 pl-6">
              <select
                value={windowStart}
                onChange={(e) => setWindowStart(Number(e.target.value))}
                aria-label="Window start"
                className="h-10 rounded-lg border border-line bg-card px-2 font-mono text-[13px]"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </select>
              <span className="text-[13px] text-ink-mute">to</span>
              <select
                value={windowEnd}
                onChange={(e) => setWindowEnd(Number(e.target.value))}
                aria-label="Window end"
                className="h-10 rounded-lg border border-line bg-card px-2 font-mono text-[13px]"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </select>
              {windowStart > windowEnd && (
                <span className="text-[12px] text-ink-mute">(overnight window)</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {save.isPending ? 'Saving…' : 'Save stage'}
          </button>
          {saved && <span className="text-[13px] font-semibold text-brand">Saved ✓</span>}
          <TestSendButton stage={step.order} />
          <button
            type="button"
            disabled={reset.isPending}
            onClick={() => {
              if (window.confirm('Reset this stage to the built-in subject and body?')) {
                reset.mutate()
              }
            }}
            className="ml-auto text-[13px] font-semibold text-ink-faint transition-colors hover:text-rose"
          >
            Reset to default
          </button>
        </div>
      </div>

      <PreviewPane stage={step.order} subject={subject} bodyHtml={bodyDraft} />
    </div>
  )
}

function ReactivationViewer({ subject }: { subject: string }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(400px,1fr)_minmax(420px,560px)]">
      <div className="space-y-5">
        <Field label="Subject">
          <input type="text" value={subject} readOnly className={`${inputClass} bg-paper`} />
        </Field>
        <p className="rounded-lg bg-slate-tint px-3.5 py-2.5 text-[13px] leading-relaxed text-slate">
          The reactivation email is sent automatically — once per case — when a subscription
          is canceled because payments kept failing. Editing it is coming in a later phase.
        </p>
        <div className="border-t border-line-soft pt-5">
          <TestSendButton stage="reactivation" />
        </div>
      </div>
      <PreviewPane stage="reactivation" />
    </div>
  )
}

export function StageEditorPage() {
  const { stageId } = useParams()
  const { data: campaign } = useQuery({ queryKey: ['campaign'], queryFn: fetchCampaign })

  const isReactivation = stageId === 'reactivation'
  const step = campaign?.steps.find((s) => s.id === stageId)

  return (
    <div>
      <Link
        to="/app/sequence"
        className="text-[13px] font-semibold text-ink-mute transition-colors hover:text-ink"
      >
        ← Sequence
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
        {isReactivation ? 'Reactivation email' : step ? `Stage ${step.order}` : 'Stage'}
      </h1>
      <p className="mt-1 text-sm text-ink-mute">
        {isReactivation
          ? 'The one-shot win-back email for involuntary cancellations.'
          : 'Subject, body, timing, and per-stage controls.'}
      </p>

      <div className="mt-8">
        {!campaign ? (
          <p className="font-mono text-sm text-ink-faint">Loading…</p>
        ) : isReactivation ? (
          <ReactivationViewer subject={campaign.reactivation.subject} />
        ) : step ? (
          <StepEditor key={step.id} step={step} />
        ) : (
          <p className="text-sm text-ink-mute">This stage doesn&rsquo;t exist.</p>
        )}
      </div>
    </div>
  )
}
