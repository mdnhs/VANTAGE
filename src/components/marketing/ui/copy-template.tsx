import type { ReactNode } from 'react';

// Fills `{token}` placeholders in editable copy. Each filled value is wrapped (by default
// in the bold white emphasis the success messages use); unknown tokens are left as typed.
export function fillCopy(
  template: string,
  values: Record<string, string>,
  wrap: (value: string, token: string) => ReactNode = (value, token) => (
    <strong key={token} className='font-semibold text-white'>
      {value}
    </strong>
  ),
): ReactNode[] {
  return template.split(/(\{[a-zA-Z]+\})/).map((part, index) => {
    const token = /^\{([a-zA-Z]+)\}$/.exec(part)?.[1];
    if (token !== undefined && Object.hasOwn(values, token)) {
      const node = wrap(values[token]!, token);
      return <span key={index}>{node}</span>;
    }
    return part;
  });
}
