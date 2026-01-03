import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
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
      id: 'coming-soon-2',
      title: '採光計算',
      description: 'Coming Soon...',
      href: '#',
      active: false,
    },
    {
      id: 'zoning-info',
      title: '用途地域検索',
      description: '住所から用途地域・建ぺい率・容積率を検索します。(要APIキー)',
      href: '/tools/zoning-info',
      active: true,
    },
    {
      title: 'パッシブデザイン診断',
      description: '気象データに基づき、風と光を活かす最適な設計方針を提案。',
      href: '/tools/passive-design',
      active: true,
    },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32 bg-gray-50 dark:bg-gray-900 rounded-3xl p-8">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Architectural Tools
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            建築設計実務をサポートする便利ツール集。
          </p>
          <div className="space-x-4">
            <Link href="/tools">
              <Button size="lg" className="rounded-full">すべてのツールを見る</Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="tools" className="container space-y-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">Tools</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            現在利用可能なツール一覧
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {tools.map((tool) => (
            <Link href={tool.href} key={tool.id} className={!tool.active ? 'pointer-events-none opacity-50' : ''}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-800">
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
      </section>
    </div>
  );
}
