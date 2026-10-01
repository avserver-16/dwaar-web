import { useState } from 'react';
import { api } from '../api';
import { Card, PageHead, useAction } from '../components';

export default function Upload() {
  const [run, busy] = useAction();
  const [file, setFile] = useState(null);
  const [done, setDone] = useState([]);

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await api.upload(file);
      setDone((d) => [{ ...r.file, name: file.name }, ...d]);
      setFile(null);
      e.target.reset();
    }, 'File uploaded');
  };

  return (
    <>
      <PageHead title="Upload" sub="Store files on Cloudinary and get a shareable link" />
      <Card title="New upload">
        <form className="row wrap" onSubmit={submit}>
          <input type="file" required onChange={(e) => setFile(e.target.files[0] || null)} />
          <button disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</button>
        </form>
      </Card>
      {done.length > 0 && (
        <Card title="Uploaded this session">
          <ul className="list">
            {done.map((f) => (
              <li key={f.public_id} className="item">
                {f.resource_type === 'image' && <img className="thumb" src={f.url} alt="" />}
                <div className="grow">
                  <b>{f.name}</b>
                  <div className="muted small">{f.resource_type} · {f.format} · {(f.bytes / 1024).toFixed(1)} KB</div>
                  <a className="small" href={f.url} target="_blank" rel="noreferrer">{f.url}</a>
                </div>
                <button className="ghost" onClick={() => navigator.clipboard?.writeText(f.url)}>Copy link</button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
