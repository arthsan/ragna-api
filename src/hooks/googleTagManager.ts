import { useState, useEffect } from 'react';
import { loadEnvConfig } from '@next/env';

const GTM_ID = process.env.GTM_ID;

export default function useGTM() {
  const [gtm, setGtm] = useState();
  
  useEffect(() => {
    import('react-gtm-module')
    .then((x) => x.default)
    .then((TagManager) => {
      const tagManagerArgs = {
          gtmId: GTM_ID,
          dataLayerName: 'PageDataLayer',
          dataLayer: {
            page: window?.location.href,
          },
        };
        TagManager.initialize(tagManagerArgs);
        TagManager.dataLayer(tagManagerArgs);
        setGtm(TagManager);
      });
    return () => setGtm(null);
  },[]);
}
