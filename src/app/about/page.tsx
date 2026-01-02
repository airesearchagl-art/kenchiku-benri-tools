import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function AboutPage() {
    return (
        <div className="container py-12 max-w-4xl mx-auto space-y-12">
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

            <div className="text-center pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Architectural Tools Project. All rights reserved.
                </p>
            </div>
        </div>
    );
}
