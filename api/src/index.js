import { createApp } from './app.js';
import { config } from './config.js';

if (!config.databaseUrl) {
  console.warn(
    '[config] DATABASE_URL chưa được cấu hình. Các endpoint truy cập database sẽ trả lỗi 500.'
  );
}

const app = createApp();
app.listen(config.port, () => {
  console.log(`[api] Ấm Vị API đang chạy tại ${config.appBaseUrl} (env: ${config.nodeEnv})`);
});
