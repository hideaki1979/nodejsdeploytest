# JNavi API サーバー

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/hideaki1979/nodejsdeploytest?utm_source=oss&utm_medium=github&utm_campaign=hideaki1979%2Fnodejsdeploytest&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## プロジェクト概要

JNavi API サーバーは、ラーメン店の情報管理、地図表示、メニュー画像管理のための RESTful API を提供するバックエンドサーバーです。Node.js、Express、TypeScript、Prisma、PostgreSQL を使用して構築されています。

## 技術スタック

- バックエンド: Node.js, Express, TypeScript
- データベース: PostgreSQL
- ORM: Prisma
- 画像ストレージ: Firebase Storage
- その他ツール: ESLint, dotenv

## 主要機能

- 店舗情報の登録・取得 API
- 地図情報の取得 API
- メニュー画像のアップロード・取得 API
- トッピングとコールオプション管理 API

## プロジェクト構造

### 主要エンドポイント

| メソッド | エンドポイント           | 説明                                         |
| -------- | ------------------------ | -------------------------------------------- |
| GET      | /                        | ウェルカムメッセージ                         |
| GET      | /health                  | ヘルスチェック                               |
| POST     | /stores                  | 店舗情報の登録                               |
| GET      | /stores/:id              | 店舗情報の取得                               |
| GET      | /maps                    | 全店舗の地図情報取得                         |
| GET      | /stores                  | 全店舗情報一覧の取得                         |
| GET      | /stores/:id/toppingcalls | 店舗のトッピングコール情報の取得             |
| POST     | /stores/:id/images       | 店舗の画像をアップロード                     |
| GET      | /stores/:id/images       | 店舗の画像情報を取得                         |
| GET      | /toppings                | トッピング情報の取得                         |
| GET      | /calloptions             | コールオプション情報の取得                   |
| GET      | /toppings/calloptions    | トッピングとコールオプションの関連情報を取得 |

## 環境構築

### 前提条件

- Node.js v22.x
- PostgreSQL v16
- Firebase プロジェクト（画像ストレージ用）

### インストール

1. リポジトリをクローン

   ```bash
   git clone https://github.com/your-username/jnavi-api.git
   cd jnavi-api
   ```

2. 依存パッケージのインストール

   ```bash
   npm install
   ```

3. 環境変数の設定

   ```env
   # .envファイルを作成し、以下の環境変数を設定:
   DATABASE_URL="postgresql://username:password@localhost:5432/jnavi_db"
   FIREBASE_API_KEY="your-api-key"
   FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   FIREBASE_APP_ID="your-app-id"
   PORT=3000
   ```

4. データベースのマイグレーション実行

   ```bash
   npx prisma migrate dev
   ```

5. サーバーの起動

   - 開発モード:

     ```bash
     npm run dev
     ```

   - 本番モード:

     ```bash
     npm run build
     npm start
     ```

## データベース構造

### 主要テーブル

| テーブル名                | 説明                                       |
| ------------------------- | ------------------------------------------ |
| stores                    | 店舗情報（名前、住所、営業時間など）       |
| maps                      | 店舗の地図情報（緯度・経度）               |
| images                    | メニュー画像情報                           |
| toppings                  | トッピング種類（チャーシュー、メンマなど） |
| call_options              | コールオプション（マシマシ、カラメなど）   |
| store_topping_calls       | 店舗ごとのトッピングコール設定             |
| image_store_topping_calls | 画像とトッピングコールの関連               |

## Firebase Storage

メニュー画像は Firebase Storage に保存され、公開 URL としてデータベースに記録されます。  
画像パスは以下の形式で管理されます：

```plaintext
stores/{store_id}/{uuid}_{timestamp}.{extension}
```

## 開発環境

- [Visual Studio Code](https://code.visualstudio.com/) - 推奨エディタ
- [ESLint](https://eslint.org/) - コード品質管理
- [TypeScript](https://www.typescriptlang.org/) - 型安全な JavaScript
- [Prisma Studio](https://www.prisma.io/studio) - データベース管理 UI

## ビルドとデプロイ

### ビルド

```bash
# TypeScriptのコンパイル
npm run build

# ビルド結果の確認
npm run start:prod
```

### デプロイ

```bash
# 本番環境へのデプロイ
npm run deploy
```

CI/CD パイプラインを使用して、main/master ブランチへのマージ時に自動デプロイが行われます。
デプロイ先環境の詳細はプロジェクト管理者にお問い合わせください。

## ライセンス

MIT License
