# 恐竜タイプ診断

24問の回答から5つの性格軸をスコアリングし、16種類の恐竜タイプに分類する静的Webサイトです。GitHub Pagesで公開できるよう、バックエンドなしのHTML/CSS/JavaScript構成にしています。

## 起動方法

ローカルでは `fetch` でJSONを読むため、ファイルを直接開くのではなく簡易サーバー経由で確認してください。

```powershell
cd C:\05.GitHub\dino_personality
python -m http.server 4173
```

ブラウザで以下を開きます。

```text
http://localhost:4173/
```

## 主な機能

- トップページ
- 24問の診断ページ
- 5軸スコア計算
- 16タイプ判定
- 結果ページ
- レーダーチャート表示
- 結果画像保存
- 16タイプ図鑑
- 画像未配置時のプレースホルダー表示
- スマホ表示前提の9:16結果カード
- `1080x1920px` の結果画像保存

## デザインモック

実装前にイラスト生成でスマホ向けUIモックを作成し、以下に保存しています。

```text
docs/mockups/mobile-ui-mockup.png
docs/mockups/implementation_basis.md
```

実装はこのモックと `docs/` 配下の設計書を基準にしています。検証用スクリーンショットは以下です。

```text
docs/mockups/implemented-home-390.png
docs/mockups/implemented-result-390.png
```

## データ

- `data/questions.json`: 設問と選択肢
- `data/dino_types.json`: 16タイプの定義
- `data/scoring_rules.json`: 軸名、表示名、判定方針

設計書は `docs/` 配下を正本として扱います。

## アセット追加方法

画像を追加する場合は、以下の命名で配置してください。未配置でもCSSプレースホルダーで表示が崩れないようにしています。

```text
assets/images/dinos/real/{type_id}.webp
assets/images/dinos/mascot/{type_id}.webp
assets/images/cards/bg_{type_id}.webp
assets/images/ui/logo.svg
assets/images/manifest.json
```

例:

```text
assets/images/dinos/real/tyranno.webp
assets/images/dinos/mascot/tyranno.webp
```

画像を追加したら、`assets/images/manifest.json` に表示可能な `type_id` を追加してください。画像未配置時は、通信エラーを出さずにCSSプレースホルダーを表示します。

## GitHub Pages公開方法

1. GitHubで新規リポジトリを作成します。
2. このフォルダをリモートへpushします。
3. GitHubの `Settings` → `Pages` で公開元を `main` ブランチのルートに設定します。
4. 公開URLでトップ、診断、結果、図鑑の表示を確認します。

このサイトは相対パスでアセットとJSONを参照しているため、GitHub Pagesのプロジェクトページ配下でも動作する想定です。
