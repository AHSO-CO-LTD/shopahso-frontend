import Script from "next/script";

export default function AnalyticsScripts() {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN?.trim();

  return (
    <>
      {gaMeasurementId ? (
        <>
          <Script
            id="shopahso-ga-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="shopahso-ga-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(gaMeasurementId)});
              `,
            }}
          />
        </>
      ) : null}

      {mixpanelToken ? (
        <Script
          id="shopahso-mixpanel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];
              b.init=function(e,f,c){function g(a,d){var b=d.split(".");
              2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}
              var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];
              a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};
              a.people.toString=function(){return a.toString(1)+".people (stub)"};
              i="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
              for(h=0;h<i.length;h++)g(a,i[h]);b._i.push([e,f,c])};
              b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;
              e.src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
              g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);
              mixpanel.init(${JSON.stringify(mixpanelToken)}, { track_pageview: true, persistence: 'localStorage' });
            `,
          }}
        />
      ) : null}
    </>
  );
}
