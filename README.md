# 2027 政大徵才月 開幕互動動畫

開幕典禮 90 秒互動流程的 Demo：暖場掃碼 → 二選一集氣 → 能量滿格啟動，最後揭曉主視覺。

> 目前是 Demo：觀眾人數與點擊都是模擬的，QR Code 是示意圖，還沒有接多人即時連線。

## 內容

| 路徑 | 說明 |
|---|---|
| `index.html` | 主要版本（同第二版）。Canvas 2D 摺疊水晶切面、白光入射與光譜色散 |
| `versions/v1-canvas-shards.html` | 第一版。Canvas 2D 放射狀色片 |
| `versions/v2-prism-facets.html` | 第二版，與 `index.html` 內容相同 |
| `versions/v3-shader-pastel.html` | 第三版。WebGL 折射 shader，粉彩切面、中央留白 |
| `versions/v4-keyvisual-texture/` | 第四版。把主視覺原圖當貼圖做折射，最後揭曉整張海報（需要同資料夾的圖檔，要用網頁伺服器開啟） |
| `versions/v5-layered-keyvisual.html` | 第五版。用 SVG 把主視覺的每個元素各畫成獨立圖層並分別做動畫，不嵌入任何圖片 |
| `versions/v6-ai-layers/` | 第六版。直接從主視覺的 Illustrator 原始檔拆出 57 個圖層（保留原本的混合模式與透明度），每層各自做動畫（需要同資料夾的 `layers/`，要用網頁伺服器開啟） |
| `shaders/prism.frag` | 純程式折射 shader（WebGL），粉彩切面版 |
| `shaders/kv.frag` | 以主視覺圖為貼圖的折射 shader |
| `remotion/` | Remotion 影片專案（1920×1080、30fps、12 秒）：能量滿格 → 3-2-1 → 炸開 → 揭曉主視覺。使用 `remotion/public/kv.jpg` 主視覺圖 |

除第四版外，每個 HTML 都是單一檔案，直接用瀏覽器打開即可。

## 操作

- 頁面打開後自動播放三個階段；下方（或右側）是觀眾手機端，按鈕會反映到大螢幕畫面。
- 控制列：`下一段`、`重播`、`正式 90 秒`（預設為約 35 秒的快速預覽）、`模擬冷場`（示範保底機制：觀眾很少時能量仍會在時間內補滿）、`大螢幕全螢幕`。

## Remotion 影片

```bash
cd remotion
npm install
npx remotion render src/index.jsx Reveal out/reveal.mp4 --gl=angle
```

影片尚未輸出成品，專案內只有原始碼。

## 待辦

- 接上即時連線，讓現場手機真的能掃碼參與
- 取得主視覺分層原始檔後，換成真實圖層與字型
- 連線人數、二選一題目換成正式內容

主視覺版權屬政大徵才月籌備團隊。
