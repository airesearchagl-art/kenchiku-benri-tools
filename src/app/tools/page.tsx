import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function ToolsPage() {
    const tools = [
        {
            id: 'rainwater-drainage',
            title: '雨水排水検討ツール',
            description: 'アメダス過去最大降雨強度から排水管の許容面積を算定します。',
            href: '/tools/rainwater-drainage',
            active: true,
        },
        {
            id: 'sanitary-fixtures',
            title: '衛生器具数算定',
            description: '建物の用途と人員から必要な衛生器具数を算定します。',
            href: '/tools/sanitary-fixtures',
            active: true,
        },
        {
            id: 'legal-floor-area',
            title: '法定床面積計算',
            description: 'フロアごとの求積・面積表作成ツール。',
            href: '/tools/legal-floor-area',
            active: true,
        },
        {
            id: 'zoning-info',
            title: '用途地域検索',
            description: '住所から用途地域・建ぺい率・容積率を検索します。(要APIキー)',
            href: '/tools/zoning-info',
            active: true,
        },
        {
            id: 'passive-design',
            title: 'パッシブデザイン診断',
            description: '住所から過去の気象データ(風向・日射)を取得し、最適な開口部の方角や遮蔽計画を提案します。',
            href: '/tools/passive-design',
            active: true,
        },
        {
            id: 'coming-soon-2',
            title: '採光計算',
            description: 'Coming Soon...',
            href: '#',
            active: false,
        },
    ];

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col items-center space-y-4 text-center">
                <h1 className="font-heading text-3xl font-bold md:text-5xl">Tools</h1>
                <p className="text-muted-foreground text-lg">
                    利用可能なツール一覧
                </p>
            </div>
            <div className="grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {tools.map((tool) => (
                    <Link href={tool.href} key={tool.id} className={!tool.active ? 'pointer-events-none opacity-50' : ''}>
                        <Card className="h-full hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle>{tool.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{tool.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
