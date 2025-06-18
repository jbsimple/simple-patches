'use client';

import { useState, useRef } from 'react';

export default function AvatarUploadPage() {
  const inputFileRef = useRef(null);
  const [blob, setBlob] = useState(null);
  return (
    <>
      <h1>Upload an image, I guess</h1>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const file = inputFileRef.current.files.[0];

          const response = await fetch(
            `/api/fs/upload?filename=${file.name}`,
            {
              method: 'POST',
              body: file,
            },
          );

          const newBlob = (await response.json()) as PutBlobResult;

          setBlob(newBlob);
        }}
      >
        <input name="file" ref={inputFileRef} type="file" accept="image/jpeg, image/png, image/webp, image/gif" required />
        <button type="submit">Upload</button>
      </form>
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  );
}