# Vercel デプロイ手順

## 1. Vercel Postgres（本番DB）のセットアップ

Vercelダッシュボード → Storage → Create Database → Postgres を選択。

または Turso（LibSQL）を使用（SQLiteと互換性あり・無料プランあり）:
- https://turso.tech にサインアップ
- データベースを作成し、接続URLを取得

## 2. 環境変数の設定（Vercelダッシュボード）

```
DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
NEXTAUTH_SECRET=ランダムな32文字以上の文字列（openssl rand -base64 32）
NEXTAUTH_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=sk-ant-...（Anthropicコンソールで取得）
```

## 3. vercel コマンドでデプロイ

```bash
cd bus-reservation
vercel --prod
```

## 4. マイグレーション実行

```bash
DATABASE_URL=your-production-url npx prisma migrate deploy
```
