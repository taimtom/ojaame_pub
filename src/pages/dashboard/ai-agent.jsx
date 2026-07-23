import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AiAgentView } from 'src/sections/ai-agent/view/ai-agent-view';

// ----------------------------------------------------------------------

const metadata = { title: `AI Assistant - ${CONFIG.site.name}` };

export default function AiAgentPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <AiAgentView />
    </>
  );
}
