'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Trash2, Download, Layers } from 'lucide-react';
import {
    FloorData,
    Shape,
    ShapeType,
    Point,
    calculateFloorArea,
    parsePoints,
    formatPoints
} from '@/utils/areaCalculator';
import ShapeVisualizer from '@/components/ShapeVisualizer';

export default function LegalFloorAreaPage() {
    // State
    const [floors, setFloors] = useState<FloorData[]>([
        { id: '1', name: '1F', shapes: [] }
    ]);
    const [activeFloorId, setActiveFloorId] = useState<string>('1');

    // Printing state
    const [isPrinting, setIsPrinting] = useState(false);

    // Current editing shape draft
    const [shapeType, setShapeType] = useState<ShapeType>('rect');
    const [width, setWidth] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');
    const [polyPoints, setPolyPoints] = useState<string>('');
    const [subtraction, setSubtraction] = useState<boolean>(false);

    const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0];

    // -- Handlers --

    const addFloor = () => {
        const newId = (floors.length + 1).toString();
        const newName = `${floors.length + 1}F`;
        setFloors([...floors, { id: newId, name: newName, shapes: [] }]);
        setActiveFloorId(newId);
    };

    const removeFloor = (id: string) => {
        if (floors.length <= 1) return;
        const newFloors = floors.filter(f => f.id !== id);
        setFloors(newFloors);
        if (activeFloorId === id) {
            setActiveFloorId(newFloors[newFloors.length - 1].id);
        }
    };

    const addShape = () => {
        if (shapeType === 'rect') {
            if (!width || !height) return;
            const newShape: Shape = {
                id: Date.now().toString(),
                type: 'rect',
                name: `矩形 (${width}x${height})`,
                width: Number(width),
                height: Number(height),
                subtraction
            };
            updateActiveFloorShapes([...activeFloor.shapes, newShape]);
        } else {
            if (!polyPoints) return;
            const points = parsePoints(polyPoints);
            if (points.length < 3) return;
            const newShape: Shape = {
                id: Date.now().toString(),
                type: 'polygon',
                name: `多角形 (${points.length}点)`,
                points,
                subtraction
            };
            updateActiveFloorShapes([...activeFloor.shapes, newShape]);
        }
        // Reset inputs
        setWidth('');
        setHeight('');
        setPolyPoints('');
        setSubtraction(false);
    };

    const removeShape = (shapeId: string) => {
        const newShapes = activeFloor.shapes.filter(s => s.id !== shapeId);
        updateActiveFloorShapes(newShapes);
    };

    const updateActiveFloorShapes = (newShapes: Shape[]) => {
        setFloors(floors.map(f => f.id === activeFloorId ? { ...f, shapes: newShapes } : f));
    };

    const totalArea = floors.reduce((sum, f) => sum + calculateFloorArea(f), 0);

    return (
        <div className="container py-8 space-y-8 max-w-6xl">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-3xl font-bold">法定床面積計算</h1>
                    <p className="text-muted-foreground">フロアごとに形状（矩形・多角形）を追加して面積を算出します。</p>
                </div>
                <Button onClick={() => window.print()} className="gap-2">
                    <Download size={16} /> レポート出力
                </Button>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* LEFT: Controls (Input) */}
                <div className="lg:col-span-4 space-y-6 no-print">

                    {/* Floor Manager */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Layers size={16} /> フロア管理
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {floors.map(floor => (
                                    <div key={floor.id} className="relative group">
                                        <Button
                                            variant={activeFloorId === floor.id ? 'primary' : 'outline'}
                                            onClick={() => setActiveFloorId(floor.id)}
                                            className="w-16"
                                        >
                                            {floor.name}
                                        </Button>
                                        {floors.length > 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFloor(floor.id); }}
                                                className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addFloor} className="w-10 px-0">
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shape Editor */}
                    <Card className="border-blue-200 shadow-sm">
                        <CardHeader className="bg-blue-50/50 pb-3">
                            <CardTitle className="text-sm font-bold text-blue-800">
                                {activeFloor.name} に形状を追加
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" checked={shapeType === 'rect'} onChange={() => setShapeType('rect')} />
                                    矩形 (Rect)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" checked={shapeType === 'polygon'} onChange={() => setShapeType('polygon')} />
                                    多角形 (Poly)
                                </label>
                            </div>

                            {shapeType === 'rect' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs">幅 (m)</label>
                                        <Input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} placeholder="10.0" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs">高さ (m)</label>
                                        <Input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} placeholder="8.0" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs">座標リスト (x1,y1 x2,y2 ...)</label>
                                    <Input
                                        value={polyPoints}
                                        onChange={e => setPolyPoints(e.target.value)}
                                        placeholder="0,0 10,0 5,10"
                                    />
                                    <p className="text-[10px] text-muted-foreground">スペース区切りで頂点を入力</p>
                                </div>
                            )}

                            <label className="flex items-center gap-2 text-sm cursor-pointer border p-2 rounded hover:bg-slate-50">
                                <input type="checkbox" checked={subtraction} onChange={e => setSubtraction(e.target.checked)} />
                                <span className="font-bold text-red-600">除外 (欠損・吹抜)</span>として追加
                            </label>

                            <Button onClick={addShape} className="w-full" disabled={shapeType === 'rect' ? (!width || !height) : !polyPoints}>
                                <Plus size={16} className="mr-2" /> 追加する
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Shape List for Active Floor */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">登録済み形状 ({activeFloor.shapes.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {activeFloor.shapes.length === 0 && <p className="text-xs text-muted-foreground">形状はまだありません。</p>}
                            {activeFloor.shapes.map(shape => (
                                <div key={shape.id} className={`flex justify-between items-center p-2 rounded border text-sm ${shape.subtraction ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                                    <div>
                                        <span className="font-bold mr-2">{shape.subtraction ? '(-)' : '(+)'} {shape.name}</span>
                                        {shape.type === 'rect'
                                            ? <span className="text-xs text-muted-foreground">{shape.width} × {shape.height}</span>
                                            : <span className="text-xs text-muted-foreground">{shape.points?.length}点</span>
                                        }
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeShape(shape.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Visualization & Report (Printable) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Visualizer */}
                    <Card className="min-h-[300px] h-[400px] bg-slate-50 border-2">
                        <ShapeVisualizer shapes={activeFloor.shapes} />
                    </Card>

                    {/* Calculation Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>求積表</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm text-left collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-800">
                                        <th className="py-2 pl-2">階</th>
                                        <th className="py-2">形状名</th>
                                        <th className="py-2">計算式</th>
                                        <th className="py-2 pr-2 text-right">面積 (㎡)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {floors.map(floor => (
                                        <React.Fragment key={floor.id}>
                                            {floor.shapes.length === 0 ? (
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-2 pl-2 font-bold bg-slate-50">{floor.name}</td>
                                                    <td colSpan={2} className="py-2 text-muted-foreground italic pl-4">データなし</td>
                                                    <td className="py-2 pr-2 text-right">0.00</td>
                                                </tr>
                                            ) : (
                                                floor.shapes.map((shape, idx) => {
                                                    const area = calculateFloorArea({ ...floor, shapes: [shape] }); // Single shape area
                                                    return (
                                                        <tr key={shape.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                            {idx === 0 && (
                                                                <td rowSpan={floor.shapes.length} className="py-2 pl-2 font-bold bg-slate-50 align-top pt-3 border-r">
                                                                    {floor.name}
                                                                </td>
                                                            )}
                                                            <td className="py-2 pl-4">
                                                                <span className={shape.subtraction ? 'text-red-600 font-medium' : ''}>
                                                                    {shape.name} {shape.subtraction && '(除外)'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 font-mono text-xs text-muted-foreground">
                                                                {shape.type === 'rect'
                                                                    ? `${shape.width} × ${shape.height}`
                                                                    : '(座標計算)'}
                                                            </td>
                                                            <td className="py-2 pr-2 text-right font-mono">
                                                                {area.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                            {/* Floor Subtotal */}
                                            <tr className="bg-slate-50 border-b-2 border-slate-300 font-bold">
                                                <td colSpan={3} className="py-1 text-right pr-4 text-xs uppercase tracking-wider text-slate-500">
                                                    {floor.name} 小計
                                                </td>
                                                <td className="py-1 pr-2 text-right">
                                                    {calculateFloorArea(floor).toFixed(2)}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="text-lg font-bold border-t-2 border-slate-900 bg-slate-100">
                                        <td colSpan={3} className="py-3 text-right pr-4">合計床面積</td>
                                        <td className="py-3 pr-2 text-right">{totalArea.toFixed(2)} ㎡</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
