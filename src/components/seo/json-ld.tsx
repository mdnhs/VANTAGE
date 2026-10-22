import { scriptJson } from '@/lib/seo/json-ld';

// Every JSON-LD script goes through scriptJson, so admin-entered text can never end the element.
export function JsonLd({ schema }: { schema: object }) {
  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: scriptJson(schema) }} />;
}
