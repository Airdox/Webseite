import { answerFromWiki, answerWithOllama } from '../desktop/main/services/assistant.mjs';

const question = 'Was muss ich tun um ein Set von mir online zu stellen oder auf meiner Webseite verfügbar zu machen?';

const run = async () => {
  const wiki = await answerFromWiki(question);
  const ollama = await answerWithOllama({
    question,
    wikiContext: wiki?.context || wiki?.answer || '',
  });

  console.log('QUESTION:', question);
  console.log('WIKI SOURCE:', wiki?.source || 'none');
  console.log('OLLAMA SOURCE:', ollama?.source || 'none');
  console.log('ANSWER PREVIEW:', (ollama?.answer || wiki?.answer || '').slice(0, 600));
};

run().catch((error) => {
  console.error('TEST FAILED:', error.message);
  process.exit(1);
});

