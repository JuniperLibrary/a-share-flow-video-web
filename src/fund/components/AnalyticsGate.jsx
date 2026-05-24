export default function AnalyticsGate({ GA_ID }) {

  if (!GA_ID) return null;

  return (
    <>
      <script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} async />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `
        }}
      />
    </>
  );
}
