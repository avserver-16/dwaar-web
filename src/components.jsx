import { useEffect, useRef, useState } from 'react';
import { api, toAttachment } from './api';
import { useToast } from './context';

export const fmtTime = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '');

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Card({ title, actions, children }) {
  return (
    <section className="card">
      {(title || actions) && <header><h3>{title}</h3><div className="row">{actions}</div></header>}
      {children}
    </section>
  );
}

export function PageHead({ title, sub }) {
  return <div className="page-head"><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>;
}

export function Empty({ children }) {
  return <p className="muted empty">{children}</p>;
}

/** Runs an async action with error toasts and a busy flag. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const r = await fn();
      if (okMsg) toast(okMsg);
      return r;
    } catch (e) {
      toast(e.message, 'err');
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return [run, busy];
}

/** Normalises REST and socket message shapes. */
export function norm(m) {
  return {
    id: m.id || m._id || Math.random().toString(36),
    senderId: m.senderId || m.sender?._id || m.sender,
    content: m.content ?? m.message ?? '',
    type: m.type || 'TEXT',
    attachment: m.attachment,
    createdAt: m.createdAt,
  };
}

function Attachment({ a, type }) {
  if (!a?.url) return null;
  if (type === 'IMAGE') return <a href={a.url} target="_blank" rel="noreferrer"><img className="att-img" src={a.url} alt={a.fileName || 'image'} /></a>;
  if (type === 'VIDEO') return <video className="att-img" src={a.url} controls />;
  return <a className="att-file" href={a.url} target="_blank" rel="noreferrer">📎 {a.fileName || 'Download file'}</a>;
}

/** Chat window shared by private, group and room conversations. */
export function ChatThread({ messages, meId, nameOf, onSend, onTyping, typingLabel, readOnly, empty = 'No messages yet.' }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const toast = useToast();

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend({ message: t, type: 'TEXT', attachment: null });
    setText('');
    onTyping?.(false);
  };

  const pickFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const res = await api.upload(file);
      const { type, attachment } = toAttachment(res.file, file);
      onSend({ message: text.trim(), type, attachment });
      setText('');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const change = (e) => {
    setText(e.target.value);
    if (!onTyping) return;
    onTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1500);
  };

  return (
    <div className="thread">
      <div className="msgs">
        {messages.length === 0 && <Empty>{empty}</Empty>}
        {messages.map((raw) => {
          const m = norm(raw);
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={`bubble ${mine ? 'mine' : ''}`}>
              {!mine && <b className="from">{nameOf(m.senderId)}</b>}
              <Attachment a={m.attachment} type={m.type} />
              {m.content && <div>{m.content}</div>}
              <time>{fmtTime(m.createdAt)}</time>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {typingLabel && <div className="typing muted">{typingLabel}</div>}
      {!readOnly && (
        <form className="composer" onSubmit={submit}>
          <input type="file" hidden ref={fileRef} onChange={pickFile} />
          <button type="button" className="ghost" disabled={busy} onClick={() => fileRef.current.click()} title="Attach file">📎</button>
          <input value={text} onChange={change} placeholder={busy ? 'Uploading…' : 'Type a message'} />
          <button type="submit" disabled={busy}>Send</button>
        </form>
      )}
    </div>
  );
}

/** Loads the user directory once and gives an id → name lookup. */
export function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.users().then(setUsers).catch(() => {}); }, []);
  const nameOf = (id) => users.find((u) => u._id === id)?.name || 'Someone';
  return { users, nameOf };
}
