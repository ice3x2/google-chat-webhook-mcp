import axios from 'axios';

async function run() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!webhook) {
    console.error('Set GOOGLE_CHAT_WEBHOOK_URL env var before running');
    process.exit(2);
  }

  const payload = {
    text: 'Cards V2 test from MCP server',
    cardsV2: [
      {
        cardId: 'card-1',
        card: {
          header: {
            title: '빌드 완료',
            subtitle: '프로젝트 빌드가 성공적으로 완료되었습니다'
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: '모든 유닛 테스트가 성공적으로 통과했습니다.'
                  }
                },
                {
                  keyValue: {
                    topLabel: '브랜치',
                    content: 'main'
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  };

  try {
    const res = await axios.post(webhook, payload, { timeout: 5000 });
    console.log('Send response status:', res.status);
    console.log('Response data:', res.data);
  } catch (err: unknown) {
    console.error('Send error:', err);
    process.exit(1);
  }
}

run();
