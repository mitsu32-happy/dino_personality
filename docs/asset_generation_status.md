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

## 2026-05-21 追記

ユーザー確認により、リアル恐竜が背景付き矩形として浮いて見える点を修正対象にした。以後、リアル恐竜もクロマキー背景で生成し、切り抜き/透過WebPとしてカード背景になじませる。

## 2026-05-21 バッチ2

### 完了

- `tyranno` のリアル寄り恐竜を透過WebPに差し替え。
- 優先タイプ3種のリアル寄り恐竜とマスコットを透過WebPで生成。
  - `raptor`
  - `ankylo`
  - `trike`

### 実装反映

- `assets/images/manifest.json` の `real` / `mascot` に4タイプを登録。
- 結果カードと図鑑では生成済みタイプのみWebPを表示し、未生成タイプはプレースホルダーを継続。

### 次回

- 優先4タイプの結果カード背景 `assets/images/cards/bg_{type_id}.webp` を生成する。
- その後、残り12タイプを4タイプずつ生成する。

## 2026-05-21 バッチ3

### 完了

- 追加4タイプのリアル寄り恐竜とマスコットを透過WebPで生成。
  - `troodon`
  - `brachio`
  - `carno`
  - `parasauro`

### 実装反映

- `assets/images/manifest.json` の `real` / `mascot` に合計8タイプを登録。
- 結果カードと図鑑では生成済み8タイプのみWebPを表示し、未生成8タイプはプレースホルダーを継続。

### 次回

- 残り8タイプを2バッチに分けて生成する。
  - バッチ4: `spino`, `deino`, `iguanodon`, `galli`
  - バッチ5: `stego`, `ovi`, `allo`, `maia`
- 全タイプのリアル/マスコット完了後に、タイプ別結果カード背景を生成する。
