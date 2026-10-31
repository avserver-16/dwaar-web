import { useState } from 'react';
import { useUploadMutation } from '../queries/useUploadMutation';
import { Card, PageHead } from '../components';
import { toast } from '../stores/useToastStore';

export default function Upload() {
  const uploadMutation = useUploadMutation();
  const [file, setFile] = useState(null);
  const [done, setDone] = useState([]);

  const submit = (e) => {
    e.preventDefault();
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: (res) => {
        setDone((d) => [{ ...res.file, name: file.name }, ...d]);
        setFile(null);
        e.target.reset();
        toast('File uploaded successfully', 'ok');
      },
    });
  };

  return (
    <>
      <PageHead
        title="Upload Assets"
        sub="Upload images, videos, and documents to Cloudinary for attachments"
      />

      <Card title="New Upload">
        <form className="row wrap" onSubmit={submit}>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <button disabled={uploadMutation.isPending || !file}>
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </Card>

      {done.length > 0 && (
        <Card title="Uploaded Assets this Session">
          <ul className="list">
            {done.map((f) => (
              <li key={f.public_id} className="item">
                {f.resource_type === 'image' && (
                  <img className="thumb" src={f.url} alt="" />
                )}
                <div className="grow">
                  <b>{f.name}</b>
                  <div className="muted small">
                    {f.resource_type} · {f.format} · {(f.bytes / 1024).toFixed(1)} KB
                  </div>
                  <a className="small" href={f.url} target="_blank" rel="noreferrer">
                    {f.url}
                  </a>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(f.url);
                    toast('Link copied to clipboard', 'ok');
                  }}
                >
                  Copy link
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
