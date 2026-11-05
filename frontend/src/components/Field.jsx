import { useId } from 'react';

// as="input" | "textarea" | "select"
export default function Field({ label, hint, as: Tag = 'input', children, ...props }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-describedby={hintId} {...props}>{children}</Tag>
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
    </div>
  );
}

export function FormMessage({ error, success }) {
  if (error) return <p className="msg msg-error" role="alert">{error}</p>;
  if (success) return <p className="msg msg-success" role="status">{success}</p>;
  return null;
}
