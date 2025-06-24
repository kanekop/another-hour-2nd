import express, { Express, Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

const publicPath = path.resolve(__dirname, '../public');

// 静的ファイルの提供
app.use(express.static(publicPath));

// すべてのルートでindex.htmlを返す（シングルページアプリケーション対応）
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Clock Web server running on http://localhost:${PORT}`);
}); 