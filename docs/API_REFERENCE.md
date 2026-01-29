# API利用リファレンス

このドキュメントでは、建築便利ツールプロジェクトで使用している外部APIと内部APIの詳細をまとめています。

## 目次

- [雨水排水検討ツール](#雨水排水検討ツール)
- [衛生器具数算定](#衛生器具数算定)
- [法定床面積計算](#法定床面積計算)
- [用途地域検索](#用途地域検索)
- [パッシブデザイン診断](#パッシブデザイン診断)
- [3D都市モデルシミュレーター](#3d都市モデルシミュレーター)

---

## 雨水排水検討ツール

### 使用API

#### 1. 国土地理院 住所検索API
- **エンドポイント**: `https://msearch.gsi.go.jp/address-search/AddressSearch`
- **用途**: 住所から緯度経度を取得
- **パラメータ**:
  - `q`: 検索する住所（URLエンコード必須）
- **レスポンス**: GeoJSON形式
- **認証**: 不要
- **料金**: 無料
- **ドキュメント**: [国土地理院 地理院地図](https://maps.gsi.go.jp/)

#### 2. 気象庁 過去の気象データAPI（内部API経由）
- **エンドポイント**: `/api/rainwater/rainfall`（内部APIルート）
- **外部データソース**: 気象庁公式サイト
- **用途**: 観測所の過去最大10分間降雨量を取得
- **パラメータ**:
  - `prec_no`: 観測所の管区番号
  - `station_name`: 観測所名
- **データ取得方法**: スクレイピング（Cheerio使用）
- **認証**: 不要
- **料金**: 無料

---

## 衛生器具数算定

### 使用API

このツールは外部APIを使用せず、完全にクライアントサイドで動作します。

**使用基準**:
- SHASE-S 206（空気調和・衛生工学会規格）
- データソース: ローカルの計算ロジック（`src/utils/sanitaryCalculator.ts`）

---

## 法定床面積計算

### 使用API

このツールは外部APIを使用せず、完全にクライアントサイドで動作します。

**計算方法**:
- 矩形: 幅 × 高さ
- 多角形: Shoelace公式（座標ベース面積計算）
- データソース: ローカルの計算ロジック（`src/utils/areaCalculator.ts`）

---

## 用途地域検索

### 使用API

#### 1. HeartRails Geo API（ジオコーディング）
- **エンドポイント**: `https://geoapi.heartrails.com/api/json`
- **用途**: 住所から緯度経度を取得
- **パラメータ**:
  - `method`: `suggest`
  - `matching`: `like`
  - `keyword`: 検索する住所
- **レスポンス**: JSON形式
- **認証**: 不要
- **料金**: 無料
- **ドキュメント**: [HeartRails Geo API](http://geoapi.heartrails.com/)

#### 2. 不動産情報ライブラリAPI
- **エンドポイント**: `/api/zoning/proxy`（内部プロキシ経由）
- **外部API**: `https://www.reinfolib.mlit.go.jp/ex-api/external/XIT/`
- **用途**: 用途地域、建ぺい率、容積率、防火地域などの都市計画情報を取得
- **認証**: APIキー必須（ヘッダー: `X-MLIT-API-KEY`）
- **料金**: 無料（要申請）
- **申請URL**: https://www.reinfolib.mlit.go.jp/api/request/
- **データ形式**: GeoJSON（ベクトルタイル）

**取得レイヤー**:
- `XKT002`: 用途地域
- `XKT014`: 防火・準防火地域
- `XKT020`: 大規模盛土造成地
- `XKT023`: 地区計画

**パラメータ**:
- `id`: レイヤーID
- `z`: ズームレベル
- `x`: タイルX座標
- `y`: タイルY座標

---

## パッシブデザイン診断

### 使用API

#### 1. HeartRails Geo API（ジオコーディング）
- **エンドポイント**: `https://geoapi.heartrails.com/api/json`
- **用途**: 住所から緯度経度を取得
- **パラメータ**:
  - `method`: `suggest`
  - `matching`: `like`
  - `keyword`: 検索する住所
- **認証**: 不要
- **料金**: 無料

#### 2. HeartRails Geo API（逆ジオコーディング）
- **エンドポイント**: `https://geoapi.heartrails.com/api/json`
- **用途**: 緯度経度から住所を取得（マップピン移動時）
- **パラメータ**:
  - `method`: `searchByGeoLocation`
  - `x`: 経度
  - `y`: 緯度
- **認証**: 不要
- **料金**: 無料

#### 3. Open-Meteo API
- **エンドポイント**: `https://archive-api.open-meteo.com/v1/archive`
- **用途**: 過去1年間の気象データ（風向、風速、日射量）を取得
- **パラメータ**:
  - `latitude`: 緯度
  - `longitude`: 経度
  - `start_date`: 開始日
  - `end_date`: 終了日
  - `hourly`: 取得する気象要素（`wind_speed_10m`, `wind_direction_10m`, `shortwave_radiation`）
  - `timezone`: タイムゾーン（`Asia/Tokyo`）
- **レスポンス**: JSON形式
- **認証**: 不要
- **料金**: 無料（商用利用可能）
- **ドキュメント**: [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)

---

## 3D都市モデルシミュレーター

### 使用API

#### 1. Google Geocoding API
- **エンドポイント**: `https://maps.googleapis.com/maps/api/geocode/json`
- **用途**: 住所から緯度経度を取得
- **パラメータ**:
  - `address`: 検索する住所
  - `key`: Google Maps APIキー
- **認証**: APIキー必須
- **料金**: 月$200の無料クレジットあり、超過分は従量課金
- **ドキュメント**: [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)

#### 2. Project PLATEAU 3D Tiles API
- **データソース**: 国土交通省 Project PLATEAU
- **フォーマット**: 3D Tiles (Cesium形式)
- **用途**: 都市の3D建物モデルを取得・表示
- **アクセス方法**: Cesium Ion経由でストリーミング
- **認証**: Cesium Ion アクセストークン必須
- **料金**: Cesium Ionの無料枠内で利用可能
- **ドキュメント**: [Project PLATEAU](https://www.mlit.go.jp/plateau/)

#### 3. Mapbox GL JS API
- **用途**: 軽量モードでの2D地図表示
- **認証**: Mapboxアクセストークン必須
- **料金**: 月50,000マップロードまで無料
- **ドキュメント**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

---

## API認証情報の管理

### 環境変数

プロジェクトでは以下の環境変数を使用します（`.env.local`に設定）:

```env
# Google Maps API（Plateau Shadow用）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Cesium Ion（Plateau Shadow用）
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token

# Mapbox（Plateau Shadow用）
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### ブラウザストレージ

- **不動産情報ライブラリAPIキー**: `localStorage`に保存（キー: `mlit_api_key`）
  - ユーザーが手動で入力・保存
  - 用途地域検索ツールで使用

---

## API利用上の注意事項

### レート制限

1. **Open-Meteo**: 公式にレート制限の記載なし（商用利用可能）
2. **HeartRails Geo API**: 明示的な制限なし（常識的な範囲で利用）
3. **国土地理院**: 明示的な制限なし（サーバー負荷に配慮）
4. **不動産情報ライブラリ**: APIキー申請時の規約に従う
5. **Google Maps API**: 月$200の無料クレジット（約28,000リクエスト相当）
6. **Mapbox**: 月50,000マップロード

### データの利用規約

- **気象庁データ**: 出典明記が必要（ツール上に記載済み）
- **PLATEAU**: 政府標準利用規約（第2.0版）に準拠
- **不動産情報ライブラリ**: 提供元の利用規約に準拠

### プライバシー

- APIキーはクライアントサイドで使用されるため、`NEXT_PUBLIC_`プレフィックスを使用
- 不動産情報ライブラリのAPIキーはlocalStorageに保存（ユーザー管理）
- 個人情報は収集・保存していません

---

## トラブルシューティング

### よくある問題

1. **CORS エラー**
   - 不動産情報ライブラリAPIは内部プロキシ(`/api/zoning/proxy`)経由でアクセス
   - 気象庁データも内部API(`/api/rainwater/rainfall`)経由でスクレイピング

2. **APIキーエラー**
   - `.env.local`ファイルが正しく設定されているか確認
   - 環境変数名が`NEXT_PUBLIC_`で始まっているか確認
   - 開発サーバーを再起動

3. **データ取得失敗**
   - ネットワーク接続を確認
   - APIサービスの稼働状況を確認
   - ブラウザのコンソールでエラー詳細を確認

---

## 更新履歴

- **2026-01-04**: 初版作成
