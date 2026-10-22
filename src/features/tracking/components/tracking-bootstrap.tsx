// Server-rendered only. React does not execute an inline script it creates on
// the client, and the marketing layout is not re-created by a client
// navigation: the script runs exactly once per document.
export function TrackingBootstrap({ script }: { script: string }) {
  return <script id='vantage-tracking' dangerouslySetInnerHTML={{ __html: script }} />;
}
