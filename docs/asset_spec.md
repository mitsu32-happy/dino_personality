# アセット仕様

## 1. 結果タイプごとの画像
各16タイプにつき、以下2種類を用意する。

### 1.1 リアル寄り恐竜イラスト
- カッコイイ、迫力、古代感。
- ただし怖すぎない。
- 結果ページのメインビジュアルに使う。

### 1.2 マスコット恐竜イラスト
- 可愛い、親しみやすい、SNS向き。
- 結果カードと図鑑ページに使う。

## 2. 推奨サイズ
- リアル恐竜: 1600x1200 PNG/WebP
- マスコット恐竜: 1024x1024 PNG/WebP、透過推奨
- 結果カード背景: 1080x1920 PNG/WebP
- サイトロゴ: SVG推奨

## 3. 命名規則
- assets/images/dinos/real/{type_id}.webp
- assets/images/dinos/mascot/{type_id}.webp
- assets/images/cards/bg_{type_id}.webp
- assets/images/ui/logo.svg

例:
- assets/images/dinos/real/tyranno.webp
- assets/images/dinos/mascot/tyranno.webp

## 4. 共通画風
- リアル寄り: 迫力ある半リアル、清潔なライティング、スマホゲームのキービジュアル風。
- マスコット: ころっとした体型、表情豊か、でも幼すぎない。
- 全体: 可愛いとカッコイイの両立。

## 5. 禁止・注意
- 既存作品のキャラクターに似せない。
- MBTIや16Personalitiesのデザインに寄せすぎない。
- 他社IPの恐竜デザイン、映画固有表現を避ける。
- 文字入り画像は原則避け、文字はHTML/CSS側で載せる。
