import type { Thing, WithContext } from 'schema-dts';

export function JsonLd<T extends Thing>({ schema }: { schema: WithContext<T> }) {
  return (
    <script
      type='application/ld+json'
      // JSON.stringify escapes quotes; replacing "<" blocks tag-breaking payloads.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}
