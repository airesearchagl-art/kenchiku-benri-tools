import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Droplets, Users, Layers, MapPin, Wind, Building2 } from 'lucide-react';

export default function AboutPage() {
    const tools = [
        {
            id: 'rainwater-drainage',
            title: '雨水排水検討ツール',
            icon: Droplets,
            description: '建設地の住所から最寄りのアメダス観測所を検索し、過去最大降雨強度をもとに排水管の許容面積を算定します。',
            features: ['アメダス観測所の自動検索', '過去最大10分間降雨量の取得', '排水管径ごとの許容面積計算'],
            tech: ['国土地理院 住所検索API', '気象庁 降雨データ', 'PDF出力対応'],
            href: '/tools/rainwater-drainage',
            color: 'blue',
        },
        {
            id: 'sanitary-fixtures',
            title: '衛生器具数算定',
            icon: Users,
            description: '建物の用途と人員から必要な衛生器具数を算定します。SHASE-S 206準拠の簡易係数法シミュレーター。',
            features: ['順算定: 人員から器具数を算出', '逆算定: 器具数から対応人数を確認', 'サービスレベル別の算定'],
            tech: ['SHASE-S 206 規格準拠', 'リアルタイムグラフ表示', 'PDF出力対応'],
            href: '/tools/sanitary-fixtures',
            color: 'pink',
        },
        {
            id: 'legal-floor-area',
            title: '法定床面積計算',
            icon: Layers,
            description: 'フロアごとに形状（矩形・多角形）を追加して面積を算出。求積表を自動生成します。',
            features: ['矩形・多角形の面積計算', 'リアルタイム可視化', '除外エリア（吹抜等）対応'],
            tech: ['Canvas可視化', '座標ベース多角形計算', 'PDF出力対応'],
            href: '/tools/legal-floor-area',
            color: 'green',
        },
        {
            id: 'zoning-info',
            title: '用途地域検索',
            icon: MapPin,
            description: '住所から用途地域、建ぺい率、容積率を検索します。不動産情報ライブラリAPIを使用。',
            features: ['用途地域の自動取得', '建ぺい率・容積率の表示', '防火地域・地区計画の確認'],
            tech: ['不動産情報ライブラリAPI', 'GeoJSON解析', 'タイル座標計算'],
            href: '/tools/zoning-info',
            color: 'orange',
        },
        {
            id: 'passive-design',
            title: 'パッシブデザイン診断',
            icon: Wind,
            description: '建設地の過去の気象データを分析し、光と風を活かす設計指針を提案します。',
            features: ['季節別の卓越風向分析', '日射取得・遮蔽の方位別評価', 'インタラクティブマップ'],
            tech: ['Open-Meteo 気象API', '風配図・レーダーチャート', 'Leaflet地図連携'],
            href: '/tools/passive-design',
            color: 'sky',
        },
        {
            id: 'plateau-shadow',
            title: '3D都市モデルシミュレーター',
            icon: Building2,
            description: 'Plateauの3Dモデルで周辺建物や日影を表示。Cesium/Mapbox切替対応。',
            features: ['Plateau 3Dタイル表示', '日影シミュレーション', '軽量モード（Mapbox）搭載'],
            tech: ['Cesium.js', 'Mapbox GL JS', 'Google Geocoding API'],
            href: '/tools/plateau-shadow',
            color: 'indigo',
        },
    ];

    const colorClasses: Record<string, { border: string; bg: string; icon: string; button: string }> = {
        blue: { border: 'border-blue-200', bg: 'bg-blue-50/50', icon: 'text-blue-600', button: 'hover:bg-blue-50' },
        pink: { border: 'border-pink-200', bg: 'bg-pink-50/50', icon: 'text-pink-600', button: 'hover:bg-pink-50' },
        green: { border: 'border-green-200', bg: 'bg-green-50/50', icon: 'text-green-600', button: 'hover:bg-green-50' },
        orange: { border: 'border-orange-200', bg: 'bg-orange-50/50', icon: 'text-orange-600', button: 'hover:bg-orange-50' },
        sky: { border: 'border-sky-200', bg: 'bg-sky-50/50', icon: 'text-sky-600', button: 'hover:bg-sky-50' },
        indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50/50', icon: 'text-indigo-600', button: 'hover:bg-indigo-50' },
    };

    return (
        <div className="container py-12 max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="font-heading text-4xl font-bold">About This Project</h1>
                <p className="text-xl text-muted-foreground">
                    建築設計・実務を効率化するためのオープンソースツールキット
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="h-full border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Project Goal</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground leading-relaxed">
                        建築設計の現場では、日々多くの計算や確認作業が発生します。<br />
                        これらの作業をブラウザ上で手軽に、かつ正確に行えるツールを提供することで、
                        設計者の負担を軽減し、創造的な業務に集中できる環境を作ることを目指しています。
                    </CardContent>
                </Card>

                <Card className="h-full border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Technology Stack</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            <li><strong>Framework:</strong> Next.js (App Router)</li>
                            <li><strong>Language:</strong> TypeScript</li>
                            <li><strong>Styling:</strong> Tailwind CSS</li>
                            <li><strong>Deployment:</strong> Vercel</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Tools Section */}
            <div className="space-y-6 pt-8 border-t">
                <div className="text-center space-y-2">
                    <h2 className="font-heading text-3xl font-bold">利用可能なツール</h2>
                    <p className="text-muted-foreground">
                        現在提供している6つの専門ツールの詳細をご紹介します
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => {
                        const Icon = tool.icon;
                        const colors = colorClasses[tool.color];
                        return (
                            <Card key={tool.id} className={`h-full ${colors.border} hover:shadow-lg transition-shadow`}>
                                <CardHeader className={colors.bg}>
                                    <div className="flex items-start gap-3">
                                        <Icon className={`${colors.icon} mt-1`} size={24} />
                                        <CardTitle className="text-lg leading-tight">{tool.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {tool.description}
                                    </p>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">主要機能</h4>
                                        <ul className="text-xs space-y-1 text-muted-foreground">
                                            {tool.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-slate-400 mt-0.5">•</span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">使用技術</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {tool.tech.map((t, idx) => (
                                                <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <Link href={tool.href} className="block pt-2">
                                        <Button variant="outline" className={`w-full ${colors.button} transition-colors`} size="sm">
                                            ツールを使う →
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div className="text-center pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Architectural Tools Project. All rights reserved.
                </p>
            </div>
        </div>
    );
}
