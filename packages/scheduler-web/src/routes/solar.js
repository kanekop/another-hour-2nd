import express from 'express';
const router = express.Router();

// 太陽時刻データの取得
router.get('/times/:lat/:lng', (req, res) => {
    const { lat, lng } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    // ここでは簡易的な計算を返す
    // 実際の実装では、より正確な太陽計算アルゴリズムを使用
    const times = {
        sunrise: new Date(date.setHours(6, 0, 0)),
        sunset: new Date(date.setHours(18, 0, 0)),
        solarNoon: new Date(date.setHours(12, 0, 0))
    };
    
    res.json(times);
});

// ユーザー設定の保存
router.post('/settings', (req, res) => {
    const { dayHoursTarget, seasonalAdjustment } = req.body;
    
    // セッションに保存
    req.session.solarSettings = {
        dayHoursTarget,
        seasonalAdjustment
    };
    
    res.json({ success: true });
});

// ユーザー設定の取得
router.get('/settings', (req, res) => {
    const settings = req.session.solarSettings || {
        dayHoursTarget: 12,
        seasonalAdjustment: false
    };
    
    res.json(settings);
});

export default router;