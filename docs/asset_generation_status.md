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

## 2026-05-21 バッチ5

### 完了

- 最後の4タイプのリアル寄り恐竜とマスコットを透過WebPで生成。
  - `stego`
  - `ovi`
  - `allo`
  - `maia`

### 実装反映

- `assets/images/manifest.json` の `real` / `mascot` に全16タイプを登録。
- 結果カードと図鑑の恐竜/マスコット差し替えが全タイプ完了。

### 次回

- タイプ別結果カード背景 `assets/images/cards/bg_{type_id}.webp` を生成し、保存用PNGにも反映する。

## 2026-05-22 カード背景バッチ1

### 完了

- 優先4タイプのタイプ別結果カード背景を生成。
  - `tyranno`
  - `raptor`
  - `ankylo`
  - `trike`

### 実装反映

- `assets/images/manifest.json` の `cards` に4タイプを登録。
- 結果画面のカード背景と保存用PNGで、生成済みタイプ別背景を優先表示するように実装。

### 次回

- 残り12タイプのカード背景を4タイプずつ生成する。

## 2026-05-22 カード背景バッチ2

### 完了

- 追加4タイプのタイプ別結果カード背景を生成。
  - `troodon`
  - `brachio`
  - `carno`
  - `parasauro`

### 実装反映

- `assets/images/manifest.json` の `cards` に合計8タイプを登録。
- 生成済み背景は結果画面と保存用PNGの両方で優先表示。

### 次回

- 残り8タイプのカード背景を4タイプずつ生成する。

## 2026-05-22 カード背景バッチ3

### 完了

- 追加4タイプのタイプ別結果カード背景を生成。
  - `spino`
  - `deino`
  - `iguanodon`
  - `galli`

### 実装反映

- `assets/images/manifest.json` の `cards` に合計12タイプを登録。
- 生成済み背景は結果画面と保存用PNGの両方で優先表示。

### 次回

- 残り4タイプのカード背景を生成する。

## 2026-05-22 カード背景バッチ4

### 完了

- 最後の4タイプのタイプ別結果カード背景を生成。
  - `stego`
  - `ovi`
  - `allo`
  - `maia`

### 実装反映

- `assets/images/manifest.json` の `cards` に全16タイプを登録。
- 結果カード背景、リアル恐竜、マスコット、保存用PNGの主要画像差し替えが全タイプ完了。

### 次回

- 全体の表示品質確認と、必要に応じて個別背景・恐竜の微調整を行う。

## 2026-05-22 トップページ高品質化

### 完了

- トップページ用の生成アセットを追加。
  - `home-button`
  - `nav-quiz`
  - `nav-dex`
  - `title-plate`
  - `title-logo`
  - `professor-mascot`

### 実装反映

- 左上のトップ遷移ボタン、右上の診断/図鑑ボタンを生成アセットに差し替え。
- タイトルロゴは生成した透過ロゴプレートに正確な日本語タイトルを焼き込み、背景になじむ透過WebPとして実装。
- トップページに博士風マスコットを配置。
- 画面下部の `24質問` / `5診断軸` / `16タイプ` と、独自ロジック説明文を削除。

## 2026-05-21 バッチ4

### 完了

- 追加4タイプのリアル寄り恐竜とマスコットを透過WebPで生成。
  - `spino`
  - `deino`
  - `iguanodon`
  - `galli`

### 実装反映

- `assets/images/manifest.json` の `real` / `mascot` に合計12タイプを登録。
- 結果カードと図鑑では生成済み12タイプのみWebPを表示し、未生成4タイプはプレースホルダーを継続。

### 次回

- 残り4タイプを生成する。
  - `stego`
  - `ovi`
  - `allo`
  - `maia`
- 全タイプのリアル/マスコット完了後に、タイプ別結果カード背景を生成する。
