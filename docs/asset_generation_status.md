# アセット生成ステータス

## 2026-05-21 バッチ1

### 完了

- 共通UIアセット
  - `assets/images/ui/hero-bg.webp`
  - `assets/images/ui/quiz-bg.webp`
  - `assets/images/ui/dex-bg.webp`
  - `assets/images/ui/card-frame.webp`
  - `assets/images/ui/button-primary.webp`
  - `assets/images/ui/button-secondary.webp`
- 個別タイプ
  - `tyranno` リアル寄り恐竜: `assets/images/dinos/real/tyranno.webp`
  - `tyranno` マスコット恐竜: `assets/images/dinos/mascot/tyranno.webp`

### 実装反映

- トップ、診断、図鑑、結果カードの背景を生成アセットに差し替え。
- ボタン背景を生成アセットに差し替え。
- `tyranno` の結果画面、図鑑、保存PNGで生成画像を使用。
- 生成済みアセットを `assets/images/manifest.json` に反映。

### 検証

- `390px` スマホ幅で主要画面をスクリーンショット確認。
- 横スクロールなし。
- コンソールエラーなし。
- 保存PNGは `1080x1920px`。

### 次回

- 優先タイプ残り3種を生成する。
  - `raptor`
  - `ankylo`
  - `trike`
- 各タイプでリアル寄り恐竜、マスコット恐竜、結果カード背景を生成する。
