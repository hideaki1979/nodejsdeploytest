# J.Navi API - 二郎系ラーメン店舗情報管理 API

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="64" height="64" alt="Node.js Logo" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="64" height="64" alt="Express Logo" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="64" height="64" alt="PostgreSQL Logo" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="64" height="64" alt="TypeScript Logo" />
</p>

<p align="center">J.Navi API - 二郎系ラーメン専門の店舗情報管理・画像管理・トッピングコール管理API</p>

## 概要

J.Navi API は、二郎系ラーメン愛好家のための専門的な店舗情報管理プラットフォームのバックエンド API です。Node.js と Express を使用し、PostgreSQL データベースと Prisma ORM でデータ管理を行います。Firebase Authentication による認証、画像管理機能、そして店舗ごとのトッピングコール管理機能を提供し、二郎系ラーメンの文化を広めることを目指しています。

## 機能

### 🏪 店舗管理機能

- **店舗登録**: 店名、住所、営業時間、定休日などの基本情報を登録
- **店舗編集**: 既存店舗情報の更新・修正
- **店舗削除**: 確認ダイアログ付きの安全な削除
- **住所自動変換**: 住所入力から自動で緯度経度を取得（Google Maps Geocoding API）
- **店舗一覧取得**: 全店舗情報の取得
- **店舗詳細取得**: 指定 ID の店舗情報取得

### 📸 画像管理機能

- **画像アップロード**: 店舗外観やラーメン画像の Base64 エンコードによるアップロード
- **画像編集**: アップロード済み画像の情報更新
- **画像削除**: 不要な画像の安全な削除
- **画像一覧取得**: 店舗ごとの画像一覧取得
- **画像詳細取得**: 指定 ID の画像情報取得
- **Firebase Storage 連携**: 画像の永続化ストレージ

### 🎯 トッピングコール管理機能

- **トッピング登録**: 各店舗のトッピングオプションを登録・管理
- **コール登録**: 注文時のコール（かけ声）を店舗ごとに設定
- **トッピング一覧取得**: 全トッピング情報の取得
- **フォーマット済みトッピング取得**: フロントエンド表示用のカテゴリ別グループ化データ
- **コールオプション管理**: マシマシ等のコールオプション管理

### 👤 ユーザー管理機能

- **ユーザー登録**: Firebase Authentication によるユーザー作成
- **ユーザー情報取得**: 指定 UID のユーザー情報取得
- **認証ミドルウェア**: Firebase ID Token による認証

### 🛡️ セキュリティ機能

- **入力バリデーション**: express-validator による型安全なバリデーション
- **認証ガード**: Firebase Authentication による認証
- **エラーハンドリング**: 専用エラーハンドリングミドルウェア
- **型安全性**: TypeScript Strict Mode による実行時エラー削減
- **CORS 設定**: クロスオリジンリクエストの適切な処理
- **Helmet**: セキュリティヘッダーの自動設定

## 技術スタック

| カテゴリ                 | 技術・ライブラリ                                                                                                                                           | バージョン  | 用途                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------- |
| **言語**                 | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="20" height="20" alt="TypeScript Logo"/> TypeScript | 5.8.2       | 型安全性の確保                     |
| **ランタイム**           | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="20" height="20" alt="Node.js Logo"/> Node.js               | 22.x 以上   | JavaScript 実行環境                |
| **フレームワーク**       | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="20" height="20" alt="Express Logo"/> Express             | 4.21.2      | Web アプリケーションフレームワーク |
| **データベース**         | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="20" height="20" alt="PostgreSQL Logo"/> PostgreSQL | 16.x 以上   | リレーショナルデータベース         |
| **ORM**                  | Prisma                                                                                                                                                     | 7.9.1       | データベース操作・マイグレーション |
| **認証・ストレージ**     | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="20" height="20" alt="Firebase Logo"/> Firebase            | 14.2.0      | 認証・ファイルストレージ           |
| **HTTP クライアント**    | <img src="https://axios-http.com/assets/favicon.ico" width="20" height="20" alt="Axios Logo"/> Axios                                                       | 1.8.1       | API 通信                           |
| **バリデーション**       | express-validator                                                                                                                                          | 7.2.1       | 入力値バリデーション               |
| **DI コンテナ**          | tsyringe                                                                                                                                                   | 4.10.0      | 依存性注入                         |
| **ログ**                 | pino                                                                                                                                                       | 9.7.0       | 高性能ログライブラリ               |
| **セキュリティ**         | helmet                                                                                                                                                     | 8.1.0       | セキュリティヘッダー設定           |
| **API ドキュメント**     | swagger-ui-express                                                                                                                                         | 5.0.1       | API 仕様書自動生成                 |
| **地理情報**             | node-geocoder                                                                                                                                              | 4.4.1       | 住所から緯度経度への変換           |

## API エンドポイント

### 店舗管理

- **`POST /stores`**: 新規店舗登録
- **`GET /stores`**: 全店舗情報取得
- **`GET /stores/:id`**: 店舗詳細取得
- **`PATCH /stores/:id`**: 店舗情報更新
- **`DELETE /stores/:id`**: 店舗削除

### 画像管理

- **`POST /stores/:storeId/images`**: 店舗画像アップロード（認証必要）
- **`GET /stores/:storeId/images`**: 店舗画像一覧取得
- **`GET /stores/:storeId/images/:imageId`**: 店舗画像詳細取得
- **`PATCH /stores/:storeId/images/:imageId`**: 店舗画像情報更新（認証必要）
- **`DELETE /stores/:storeId/images/:imageId`**: 店舗画像削除（認証必要）

### トッピング管理

- **`GET /toppings`**: 全トッピング情報取得
- **`GET /toppings/calloptions/formatted`**: フォーマット済みトッピングコールオプション取得
- **`GET /calloptions`**: 全コールオプション取得

### ユーザー管理

- **`POST /users`**: 新規ユーザー作成（認証必要）
- **`GET /users/:uid`**: ユーザー情報取得（認証必要）

### システム

- **`GET /`**: ルートエンドポイント（CI/CD 動作確認用）
- **`GET /health`**: ヘルスチェック
- **`GET /api-docs`**: Swagger API ドキュメント

## 処理フロー

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant A as Auth Middleware
    participant V as Validation Middleware
    participant S as Service Layer
    participant P as Prisma ORM
    participant DB as PostgreSQL
    participant F as Firebase
    participant G as Google Maps API

    Note over C,DB: 1. 店舗登録フロー
    C->>API: POST /stores
    API->>V: バリデーション
    V-->>API: バリデーション結果
    API->>G: 住所から緯度経度変換
    G-->>API: 緯度経度
    API->>S: 店舗作成処理
    S->>P: データベース操作
    P->>DB: SQL実行
    DB-->>P: 結果
    P-->>S: 店舗データ
    S-->>API: 作成結果
    API-->>C: 201 Created

    Note over C,DB: 2. 画像アップロードフロー
    C->>API: POST /stores/:storeId/images
    API->>A: 認証チェック
    A->>F: Firebase Token検証
    F-->>A: 認証結果
    A-->>API: 認証OK
    API->>V: 画像バリデーション
    V-->>API: バリデーション結果
    API->>F: Firebase Storage アップロード
    F-->>API: 画像URL
    API->>S: 画像情報保存
    S->>P: データベース操作
    P->>DB: SQL実行
    DB-->>P: 結果
    P-->>S: 画像データ
    S-->>API: 保存結果
    API-->>C: 201 Created

    Note over C,DB: 3. エラーハンドリング
    API->>API: エラーハンドリングミドルウェア
    API-->>C: 適切なHTTPステータスコード
```

## データベース設計

```mermaid
erDiagram
    Store ||--o{ Map : has
    Store ||--o{ Image : has
    Store ||--o{ StoreToppingCall : has
    User ||--o{ Image : uploads
    Topping ||--o{ StoreToppingCall : used_in
    Topping ||--o{ ImageStoreToppingCall : appears_in
    Image ||--o{ ImageStoreToppingCall : contains
    StoreToppingCall ||--o{ ImageStoreToppingCall : referenced_by

    Store {
        bigint id PK
        string store_name
        string branch_name
        string address
        string business_hours
        string regular_holidays
        boolean prior_meal_voucher
        text topping_details
        text call_details
        boolean is_all_increased
        boolean is_lot
        text lot_detail
        boolean is_close
        datetime created_at
        datetime updated_at
    }

    Map {
        bigint id PK
        bigint store_id FK
        decimal latitude
        decimal longitude
        datetime created_at
        datetime updated_at
    }

    Image {
        bigint id PK
        bigint store_id FK
        string user_id FK
        int menu_type
        string menu_name
        text image_url
        datetime created_at
        datetime updated_at
    }

    User {
        string id PK
        string email
        string display_name
        string provider
        datetime created_at
        datetime updated_at
    }

    Topping {
        bigint id PK
        int topping_category
        string topping_name
        datetime created_at
        datetime updated_at
    }

    StoreToppingCall {
        bigint id PK
        bigint store_id FK
        bigint topping_id FK
        string call_text
        enum call_timing
        datetime created_at
        datetime updated_at
    }

    ImageStoreToppingCall {
        bigint id PK
        bigint image_id FK
        bigint topping_id FK
        bigint store_topping_call_id FK
        datetime created_at
        datetime updated_at
    }
```

## 環境構築手順

### 前提条件

- Node.js (v22 以上 ※ firebase-admin v14 の要件)
- PostgreSQL (v16 以上)
- Firebase プロジェクトの設定

### 1. プロジェクトセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/hideaki1979/nodejsdeploytest.git
cd nodedeploytest

# 依存関係のインストール
npm install
```

### 2. 環境変数設定

`.env` ファイルを作成し、以下の設定を追加：

```bash
# データベース設定
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# サーバー設定
PORT=3000
NODE_ENV=development

# Google Maps API 設定
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# Google Maps JavaScript API の API キー
# Google Cloud Console で Maps JavaScript API を有効化して取得

# Firebase 設定
# 開発環境では、サービスアカウントキーファイルへのパスを指定してください。
# 本番環境では、JSONの内容を直接FIREBASE_CONFIG環境変数に設定することもできます。
GOOGLE_APPLICATION_CREDENTIALS="path/to/your/firebase-adminsdk.json"
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"

# Prisma
PRISMA_TRANSACTION_MAX_WAIT="10000"
PRISMA_TRANSACTION_TIMEOUT="60000"
```

### 3. データベースセットアップ

```bash
# Prisma マイグレーション実行
npx prisma migrate dev

# Prisma Client の生成（src/generated/ 配下に出力される）
# 生成物はコミットされないため、クローン直後は必ず実行する
npx prisma generate

# データベースシード実行（オプション）
npx prisma db seed
```

> **補足**: Prisma 7 から接続情報は `schema.prisma` ではなくルートの `prisma.config.ts` に記述します（マイグレーション用）。アプリケーション実行時の接続は `@prisma/adapter-pg` 経由で `src/app.ts` が設定します。いずれも `DATABASE_URL` を参照するため、設定箇所は `.env` のみです。

### 4. アプリケーション起動

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build
npm start
```

### 5. アクセス確認

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

API ドキュメントは [http://localhost:3000/api-docs](http://localhost:3000/api-docs) で確認できます。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# リンター実行
npm run lint

# Prisma Studio 起動
npx prisma studio

# マイグレーション実行
npx prisma migrate dev

# データベースリセット
npx prisma migrate reset
```

## ディレクトリ構造

```
src/
├── app.ts                    # アプリケーションエントリーポイント
├── config/                   # 設定ファイル
│   ├── config.ts            # アプリケーション設定
│   ├── firebase.ts          # Firebase 設定
│   ├── logger.ts            # ログ設定
│   └── swagger.ts           # Swagger 設定
├── controllers/              # コントローラー層
│   ├── storeController.ts   # 店舗管理コントローラー
│   ├── imageController.ts   # 画像管理コントローラー
│   ├── toppingController.ts # トッピング管理コントローラー
│   └── userController.ts    # ユーザー管理コントローラー
├── services/                # サービス層
│   ├── storeService.ts     # 店舗管理サービス
│   ├── imageService.ts      # 画像管理サービス
│   ├── toppingService.ts    # トッピング管理サービス
│   ├── userService.ts      # ユーザー管理サービス
│   └── geocodingService.ts  # 地理情報サービス
├── routes/                  # ルーティング
│   ├── routes.ts           # メインルーター
│   ├── store.routes.ts     # 店舗管理ルート
│   ├── image.routes.ts     # 画像管理ルート
│   ├── topping.routes.ts   # トッピング管理ルート
│   └── user.routes.ts      # ユーザー管理ルート
├── middlewares/             # ミドルウェア
│   ├── authMiddleware.ts   # 認証ミドルウェア
│   ├── errorMiddleware.ts  # エラーハンドリング
│   ├── validation.ts       # バリデーション
│   ├── imageValidation.ts  # 画像バリデーション
│   └── userValidation.ts   # ユーザーバリデーション
├── types/                   # 型定義
│   ├── store.ts            # 店舗関連型
│   ├── image.ts            # 画像関連型
│   ├── user.ts             # ユーザー関連型
│   └── express.d.ts        # Express 拡張型
├── utils/                   # ユーティリティ
│   ├── auth.ts             # 認証ユーティリティ
│   ├── bigintExtension.ts  # BigInt 拡張
│   ├── env.ts              # 環境変数ユーティリティ
│   └── routeHandler.ts     # ルートハンドラー
├── di.token.ts             # DI トークン定義
├── generated/               # Prisma が生成するクライアント（git 管理外）
│   └── prisma/             # npx prisma generate で作成される
└── db/                     # データベース関連
    └── setupTriggers.ts    # データベーストリガー設定
```

## セキュリティ機能

- 🛡️ **型安全性**: TypeScript Strict Mode による実行時エラー削減
- ✅ **入力バリデーション**: express-validator による型安全なバリデーション
- 🔐 **認証ガード**: Firebase Authentication + ID Token 検証
- 🚫 **XSS 対策**: Helmet によるセキュリティヘッダー設定
- 📝 **エラーハンドリング**: 専用エラーハンドリングミドルウェア
- 🔒 **CORS 設定**: クロスオリジンリクエストの適切な処理

## パフォーマンス最適化

- ⚡ **非同期処理**: express-async-errors による非同期エラーハンドリング
- 🔄 **DI コンテナ**: tsyringe による依存性注入
- 🎯 **トランザクション管理**: Prisma による効率的なデータベース操作
- 📦 **ログ最適化**: pino による高性能ログ出力
- 🖼️ **画像最適化**: Firebase Storage による効率的な画像管理
- 🗺️ **地理情報最適化**: Google Maps Geocoding API による住所変換

### コード規約・重要実装ポイント

- **TypeScript Strict Mode**: 型安全性を重視し、`any`型の使用を原則禁止します。
- **アーキテクチャ設計**:
  - Controller-Service-Pattern による責務分離
  - DI コンテナによる疎結合な設計
  - ミドルウェアによる横断的関心事の分離
- **エラーハンドリング**:
  - 専用エラーハンドリングミドルウェアによる一元化
  - 適切な HTTP ステータスコードの返却
  - 日本語エラーメッセージの提供
- **データベース操作**:
  - Prisma ORM による型安全なデータベース操作
  - トランザクション管理による整合性保証
  - N+1 問題を避けるための適切なクエリ設計
- **認証・認可**:
  - Firebase Authentication によるセキュアな認証
  - ミドルウェアによる認証状態の検証
- **API 設計**:
  - RESTful API 設計原則の遵守
  - Swagger による自動ドキュメント生成
  - 適切な HTTP メソッドとステータスコードの使用

## ライセンス

このプロジェクトは **MIT ライセンス** の下で公開されています。

## API ドキュメント

🌐 **Swagger UI**: http://localhost:3000/api-docs

開発サーバー起動後、上記 URL で API 仕様書を確認できます。
