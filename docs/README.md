# 恐竜タイプ診断サイト 設計書一式

このフォルダは、GitHub Pagesで公開する「恐竜タイプ診断サイト」をCodexに実装させるための正本ドキュメントです。

## 目的
MBTI風ではなく、独自の5軸スコアリングによって「性格診断としてもしっかり機能する」恐竜タイプ診断サイトを作る。

## 重要方針
- MBTI、16Personalities等の名称・設問・タイプ名・説明文は使用しない。
- 独自診断として「恐竜タイプ診断」「古代性格タイプ診断」などの名称で構築する。
- 可愛い × カッコイイを両立する。
- 各結果にはリアル寄り恐竜イラストとマスコット恐竜イラストを両方表示する。
- image2.0でサイト全体モックを作成し、そのモックをUI/UXの基準として実装する。
- GitHub Pagesで静的公開できる構成にする。

## 推奨ファイル構成
- docs/site_spec.md: サイト全体仕様
- docs/diagnosis_logic_spec.md: 診断ロジック仕様
- docs/ui_mock_prompt.md: image2.0用モック生成プロンプト
- docs/asset_spec.md: イラスト・画像アセット仕様
- docs/result_card_spec.md: 保存用結果カード仕様
- docs/security_and_publish_spec.md: 公開・安全設計
- data/dino_types.json: 16タイプ定義
- data/questions.json: 設問案
- data/scoring_rules.json: スコアリング仕様
- codex_prompts/codex_master_instruction.md: Codexへの統合指示
