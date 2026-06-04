/**
 * Quantum CAD - Core Drawing & Viewport Engine
 * Powered by HTML5 Canvas & Vanilla JS
 */

// --- 1. 基础几何图形类定义 ---
class Shape {
    constructor(type, layer, properties) {
        this.id = 'shp_' + Math.random().toString(36).substr(2, 9);
        this.type = type; // 'line', 'rect', 'circle', 'text', 'dim'
        this.layer = layer;
        this.stroke = properties.stroke || '#00f2fe';
        this.strokeWidth = parseInt(properties.strokeWidth) || 2;
        this.strokeStyle = properties.strokeStyle || 'solid'; // 'solid', 'dashed', 'dotted'
        this.fill = properties.fill || null; // null or hex color
    }
}

class LineShape extends Shape {
    constructor(x1, y1, x2, y2, layer, properties) {
        super('line', layer, properties);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}

class RectShape extends Shape {
    constructor(x, y, w, h, layer, properties) {
        super('rect', layer, properties);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

class CircleShape extends Shape {
    constructor(cx, cy, r, layer, properties) {
        super('circle', layer, properties);
        this.cx = cx;
        this.cy = cy;
        this.r = r;
    }
}

class TextShape extends Shape {
    constructor(x, y, text, layer, properties) {
        super('text', layer, properties);
        this.x = x;
        this.y = y;
        this.text = text;
    }
}

class DimShape extends Shape {
    constructor(x1, y1, x2, y2, layer, properties) {
        super('dim', layer, properties);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}

class CurveShape extends Shape {
    constructor(points, layer, properties) {
        super('curve', layer, properties);
        this.points = points; // Array of {x, y}
    }
}

class BlockShape extends Shape {
    constructor(blockType, cx, cy, w, h, angle, layer, properties) {
        super('block', layer, properties);
        this.blockType = blockType; // 'door', 'window', 'bed', 'sofa', 'toilet'
        this.cx = cx;
        this.cy = cy;
        this.w = w;
        this.h = h;
        this.angle = angle; // in radians
    }
}

// --- Centralized CAD Premium Block Rendering Function ---
function renderBlockSymbol(ctx, blockType, w, h, strokeWidth, strokeColor) {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.fillStyle = strokeColor; // for text or filled polygons

    if (blockType === 'door') {
        const size = Math.max(w, h);
        // 门开启后的门板
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // 门洞口参考线
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.stroke();

        // 1/4 圆弧开启轨迹 (细虚线)
        ctx.save();
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, size, -Math.PI / 2, 0);
        ctx.stroke();
        ctx.restore();

    } else if (blockType === 'sliding_door') {
        // 推拉门 (双门叠合)
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-w/2, -h/2, w*0.55, h*0.4);
        ctx.strokeRect(-w*0.05, h*0.1, w*0.55, h*0.4);

    } else if (blockType === 'window') {
        // 🪟 四线标准窗户
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/6);
        ctx.lineTo(w/2, -h/6);
        ctx.moveTo(-w/2, h/6);
        ctx.lineTo(w/2, h/6);
        ctx.stroke();

    } else if (blockType === 'bed') {
        // 🛏️ 精致双人床 (带枕头和被子折线)
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-w/2, -h/2, w, h * 0.12); // 床头
        // 枕头 1 & 2
        ctx.strokeRect(-w/2 + w*0.1, -h/2 + h*0.18, w*0.32, h*0.18);
        ctx.strokeRect(w*0.08, -h/2 + h*0.18, w*0.32, h*0.18);
        // 被褥线
        ctx.beginPath();
        ctx.moveTo(-w/2, h*0.12);
        ctx.lineTo(w/2, h*0.12);
        ctx.moveTo(-w/2, h*0.35);
        ctx.lineTo(w/2, h*0.35);
        ctx.stroke();

    } else if (blockType === 'sofa') {
        // 🛋️ 精致三人沙发
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-w/2, -h/2, w, h * 0.22); // 靠背
        ctx.strokeRect(-w/2, -h/2, w * 0.12, h); // 左扶手
        ctx.strokeRect(w/2 - w * 0.12, -h/2, w * 0.12, h); // 右扶手
        // 坐垫分隔
        ctx.beginPath();
        ctx.moveTo(-w/2 + w*0.38, -h/2 + h*0.22);
        ctx.lineTo(-w/2 + w*0.38, h/2);
        ctx.moveTo(w/2 - w*0.38, -h/2 + h*0.22);
        ctx.lineTo(w/2 - w*0.38, h/2);
        ctx.stroke();

    } else if (blockType === 'dining_table') {
        // 餐厅桌椅组合 (餐桌外加6把椅子)
        ctx.strokeRect(-w*0.3, -h/2, w*0.6, h); // 主餐桌
        const chairW = w * 0.15;
        const chairH = h * 0.22;
        const chairXOffset = w * 0.35;
        for (let i = 0; i < 3; i++) {
            const y = -h/2 + h*0.15 + i*(h*0.35);
            ctx.strokeRect(-chairXOffset - chairW, y - chairH/2, chairW, chairH); // 左椅
            ctx.strokeRect(chairXOffset, y - chairH/2, chairW, chairH); // 右椅
        }

    } else if (blockType === 'stove') {
        // 双头灶台
        ctx.strokeRect(-w/2, -h/2, w, h);
        const r = Math.min(w, h) * 0.22;
        // 左炉头
        ctx.beginPath();
        ctx.arc(-w*0.24, 0, r, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-w*0.24, 0, r*0.4, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-w*0.24 - r, 0); ctx.lineTo(-w*0.24 + r, 0);
        ctx.moveTo(-w*0.24, -r); ctx.lineTo(-w*0.24, r);
        ctx.stroke();
        // 右炉头
        ctx.beginPath();
        ctx.arc(w*0.24, 0, r, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w*0.24, 0, r*0.4, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w*0.24 - r, 0); ctx.lineTo(w*0.24 + r, 0);
        ctx.moveTo(w*0.24, -r); ctx.lineTo(w*0.24, r);
        ctx.stroke();

    } else if (blockType === 'sink') {
        // 双水槽
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-w*0.44, -h*0.4, w*0.38, h*0.8);
        ctx.strokeRect(w*0.06, -h*0.4, w*0.38, h*0.8);
        ctx.beginPath();
        ctx.arc(-w*0.25, 0, w*0.04, 0, Math.PI*2);
        ctx.arc(w*0.25, 0, w*0.04, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -h*0.45);
        ctx.lineTo(0, -h*0.2);
        ctx.stroke();

    } else if (blockType === 'basin') {
        // 洗手池/洗手台
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.beginPath();
        ctx.ellipse(0, 0, w*0.38, h*0.32, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -h*0.38, 3, 0, Math.PI*2);
        ctx.moveTo(0, -h*0.38);
        ctx.lineTo(0, -h*0.22);
        ctx.stroke();

    } else if (blockType === 'toilet') {
        // 🚽 马桶
        const tw = w * 0.85;
        const th = h * 0.32;
        ctx.strokeRect(-tw/2, -h/2, tw, th);
        ctx.beginPath();
        ctx.ellipse(0, h/2 - (h - th)/2, w*0.38, (h - th)*0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, h/2 - (h - th)/2, w*0.28, (h - th)*0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

    } else if (blockType === 'ac') {
        // 空调
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/2); ctx.lineTo(-w*0.35, h/2);
        ctx.moveTo(w/2, -h/2); ctx.lineTo(w*0.35, h/2);
        ctx.stroke();
        ctx.save();
        ctx.font = `bold ${Math.max(10, Math.round(h*0.55))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AC', 0, 0);
        ctx.restore();

    } else if (blockType === 'compass') {
        // 指北针
        const r = Math.min(w, h) * 0.45;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(-r*0.25, r*0.2);
        ctx.lineTo(r*0.25, r*0.2);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.save();
        ctx.font = `bold ${Math.round(r*0.65)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('N', 0, -r*1.15);
        ctx.restore();

    } else if (blockType === 'coffee_table') {
        ctx.strokeRect(-w/2, -h/2, w, h);

    } else if (blockType === 'rug') {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.restore();

    } else if (blockType === 'floor_lamp') {
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(w, h)*0.3, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w*0.5, h*0.5);
        ctx.stroke();
    }

    ctx.restore();
}

// --- Centralized CAD Premium Block SVG Generator ---
function getBlockSVG(blockType, w, h, strokeWidth, strokeColor) {
    let svg = '';
    if (blockType === 'door') {
        const size = Math.max(w, h);
        svg += `    <line x1="0" y1="0" x2="0" y2="-${size}" />\n`;
        svg += `    <line x1="0" y1="0" x2="${size}" y2="0" />\n`;
        svg += `    <path d="M 0,-${size} A ${size} ${size} 0 0 1 ${size},0" stroke-dasharray="3,3" stroke-width="1" />\n`;
    } else if (blockType === 'sliding_door') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w*0.55}" height="${h*0.4}" />\n`;
        svg += `    <rect x="-${w*0.05}" y="${h*0.1}" width="${w*0.55}" height="${h*0.4}" />\n`;
    } else if (blockType === 'window') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <line x1="-${w/2}" y1="-${h/6}" x2="${w/2}" y2="-${h/6}" />\n`;
        svg += `    <line x1="-${w/2}" y1="${h/6}" x2="${w/2}" y2="${h/6}" />\n`;
    } else if (blockType === 'bed') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h * 0.12}" />\n`;
        svg += `    <rect x="-${w/2 + w*0.1}" y="-${h/2 + h*0.18}" width="${w*0.32}" height="${h*0.18}" />\n`;
        svg += `    <rect x="${w*0.08}" y="-${h/2 + h*0.18}" width="${w*0.32}" height="${h*0.18}" />\n`;
        svg += `    <line x1="-${w/2}" y1="${h*0.12}" x2="${w/2}" y2="${h*0.12}" />\n`;
        svg += `    <line x1="-${w/2}" y1="${h*0.35}" x2="${w/2}" y2="${h*0.35}" />\n`;
    } else if (blockType === 'sofa') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h * 0.22}" />\n`;
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w * 0.12}" height="${h}" />\n`;
        svg += `    <rect x="${w/2 - w * 0.12}" y="-${h/2}" width="${w * 0.12}" height="${h}" />\n`;
        svg += `    <line x1="-${w/2 + w*0.38}" y1="-${h/2 + h*0.22}" x2="-${w/2 + w*0.38}" y2="${h/2}" />\n`;
        svg += `    <line x1="${w/2 - w*0.38}" y1="-${h/2 + h*0.22}" x2="${w/2 - w*0.38}" y2="${h/2}" />\n`;
    } else if (blockType === 'dining_table') {
        svg += `    <rect x="-${w*0.3}" y="-${h/2}" width="${w*0.6}" height="${h}" />\n`;
        const chairW = w * 0.15;
        const chairH = h * 0.22;
        const chairXOffset = w * 0.35;
        for (let i = 0; i < 3; i++) {
            const y = -h/2 + h*0.15 + i*(h*0.35);
            svg += `    <rect x="-${chairXOffset + chairW}" y="${y - chairH/2}" width="${chairW}" height="${chairH}" />\n`;
            svg += `    <rect x="${chairXOffset}" y="${y - chairH/2}" width="${chairW}" height="${chairH}" />\n`;
        }
    } else if (blockType === 'stove') {
        const r = Math.min(w, h) * 0.22;
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <circle cx="-${w*0.24}" cy="0" r="${r}" />\n`;
        svg += `    <circle cx="-${w*0.24}" cy="0" r="${r*0.4}" />\n`;
        svg += `    <line x1="-${w*0.24 + r}" y1="0" x2="-${w*0.24 - r}" y2="0" />\n`;
        svg += `    <line x1="-${w*0.24}" y1="-${r}" x2="-${w*0.24}" y2="${r}" />\n`;
        svg += `    <circle cx="${w*0.24}" cy="0" r="${r}" />\n`;
        svg += `    <circle cx="${w*0.24}" cy="0" r="${r*0.4}" />\n`;
        svg += `    <line x1="${w*0.24 + r}" y1="0" x2="${w*0.24 - r}" y2="0" />\n`;
        svg += `    <line x1="${w*0.24}" y1="-${r}" x2="${w*0.24}" y2="${r}" />\n`;
    } else if (blockType === 'sink') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <rect x="-${w*0.44}" y="-${h*0.4}" width="${w*0.38}" height="${h*0.8}" />\n`;
        svg += `    <rect x="${w*0.06}" y="-${h*0.4}" width="${w*0.38}" height="${h*0.8}" />\n`;
        svg += `    <circle cx="-${w*0.25}" cy="0" r="${w*0.04}" />\n`;
        svg += `    <circle cx="${w*0.25}" cy="0" r="${w*0.04}" />\n`;
        svg += `    <line x1="0" y1="-${h*0.45}" x2="0" y2="-${h*0.2}" />\n`;
    } else if (blockType === 'basin') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <ellipse cx="0" cy="0" rx="${w*0.38}" ry="${h*0.32}" />\n`;
        svg += `    <circle cx="0" cy="-${h*0.38}" r="3" />\n`;
        svg += `    <line x1="0" y1="-${h*0.38}" x2="0" y2="-${h*0.22}" />\n`;
    } else if (blockType === 'toilet') {
        const tw = w * 0.85;
        const th = h * 0.32;
        svg += `    <rect x="-${tw/2}" y="-${h/2}" width="${tw}" height="${th}" />\n`;
        const ovalCy = h/2 - (h - th)/2;
        svg += `    <ellipse cx="0" cy="${ovalCy}" rx="${w*0.38}" ry="${(h - th)*0.45}" />\n`;
        svg += `    <ellipse cx="0" cy="${ovalCy}" rx="${w*0.28}" ry="${(h - th)*0.35}" />\n`;
    } else if (blockType === 'ac') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
        svg += `    <line x1="-${w/2}" y1="-${h/2}" x2="-${w*0.35}" y2="${h/2}" />\n`;
        svg += `    <line x1="${w/2}" y1="-${h/2}" x2="${w*0.35}" y2="${h/2}" />\n`;
        svg += `    <text x="0" y="0" fill="${strokeColor}" font-weight="bold" font-size="${Math.round(h*0.55)}" text-anchor="middle" dominant-baseline="central">AC</text>\n`;
    } else if (blockType === 'compass') {
        const r = Math.min(w, h) * 0.45;
        svg += `    <circle cx="0" cy="0" r="${r}" />\n`;
        svg += `    <polygon points="0,-${r} -${r*0.25},${r*0.2} ${r*0.25},${r*0.2}" fill="${strokeColor}" />\n`;
        svg += `    <text x="0" y="-${r*1.15}" fill="${strokeColor}" font-weight="bold" font-size="${Math.round(r*0.65)}" text-anchor="middle" dominant-baseline="text-after-edge">N</text>\n`;
    } else if (blockType === 'coffee_table') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" />\n`;
    } else if (blockType === 'rug') {
        svg += `    <rect x="-${w/2}" y="-${h/2}" width="${w}" height="${h}" stroke-dasharray="4,4" />\n`;
    } else if (blockType === 'floor_lamp') {
        svg += `    <circle cx="0" cy="0" r="${Math.min(w, h)*0.3}" />\n`;
        svg += `    <line x1="0" y1="0" x2="${w*0.5}" y2="${h*0.5}" />\n`;
    }
    return svg;
}


// --- 2. CAD 引擎核心管理器 ---
class CADEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 视口与画布状态
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.minZoom = 0.05;
        this.maxZoom = 50.0;
        this.vectorizeCenter = null;
        this.vectorizeImageCenter = null;
        
        // 核心绘图数据
        this.shapes = [];
        this.layers = {
            'Layer_0': { name: '图层 0 (主图层)', visible: true, locked: false, color: '#00f2fe' },
            'Dimensions': { name: '尺寸标注图层', visible: true, locked: false, color: '#ffb84d' }
        };
        this.activeLayer = 'Layer_0';

        // 绘制属性默认值
        this.defaultProperties = {
            stroke: '#00f2fe',
            strokeWidth: 2,
            strokeStyle: 'solid',
            fill: null,
            textValue: '标注文字'
        };

        // 历史栈 (Undo/Redo)
        this.undoStack = [];
        this.redoStack = [];

        // 交互状态
        this.activeTool = 'select'; // 'select', 'line', 'rect', 'circle', 'text', 'dim'
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.spacePressed = false;

        // 磁性吸附
        this.snapToGrid = true;
        this.gridSize = 20; // 物理 mm 步长

        // 当前正在绘制的临时图形/状态
        this.drawingStartPoint = null; // World coordinates {x, y}
        this.currentMouseWorld = { x: 0, y: 0 };
        this.selectedShape = null;
        this.isDraggingShape = false;
        this.dragOffset = { x: 0, y: 0 };

        this.theme = 'dark'; // 'dark' or 'light'
        this.lastPastedBlob = null;
        this.isStretchingEndpoint = false;
        this.stretchEndpointIndex = null;

        this.initViewport();
        this.initEventListeners();
        this.saveState();
        this.render();
    }

    // --- Dynamic Theme Color Resolution Helper ---
    resolveColor(color) {
        if (!color) return null;
        if (this.theme === 'dark') {
            if (color === 'wall') return '#ffffff';
            if (color === 'furniture' || color === 'block') return '#33a5ff';
            if (color === 'dimension') return '#ffb84d';
            if (color === 'text') return '#ffffff';
            // Mapping back from light theme values
            if (color === '#1a1a1a' || color === '#222222' || color === '#000000') return '#ffffff';
            if (color === '#4a90e2' || color === '#5a738e' || color === '#64748b' || color === '#3399ff') return '#00f2fe';
            return color;
        } else {
            if (color === 'wall') return '#1a1a1a';
            if (color === 'furniture' || color === 'block') return '#4a90e2';
            if (color === 'dimension') return '#475569';
            if (color === 'text') return '#1a1a1a';
            // Mapping from dark theme values
            if (color === '#ffffff') return '#1a1a1a';
            if (color === '#00f2fe' || color === '#33a5ff') return '#4a90e2';
            return color;
        }
    }

    // --- 3. 视口矩阵变换 ---
    initViewport() {
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });

        // 初始将世界原点 (0,0) 置于画布中心
        this.panX = this.canvas.clientWidth / 2;
        this.panY = this.canvas.clientHeight / 2;
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // 样式尺寸保持 100% 容器尺寸
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.panX) / this.zoom,
            y: (sy - this.panY) / this.zoom
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: wx * this.zoom + this.panX,
            y: wy * this.zoom + this.panY
        };
    }

    getSnappedPoint(worldPt) {
        if (!this.snapToGrid) return worldPt;
        return {
            x: Math.round(worldPt.x / this.gridSize) * this.gridSize,
            y: Math.round(worldPt.y / this.gridSize) * this.gridSize
        };
    }

    // --- 4. 撤销与重做管理 (History Stack) ---
    saveState() {
        // 限制栈大小为 50，防止内存泄漏
        if (this.undoStack.length >= 50) this.undoStack.shift();
        
        this.undoStack.push(JSON.stringify({
            shapes: this.shapes,
            layers: this.layers,
            activeLayer: this.activeLayer
        }));
        this.redoStack = []; // 清空重做栈
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length <= 1) return; // 至少保留初始状态
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);

        const prevStateStr = this.undoStack[this.undoStack.length - 1];
        this.restoreState(prevStateStr);
        this.selectedShape = null;
        this.render();
        this.updateUndoRedoButtons();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const nextStateStr = this.redoStack.pop();
        this.undoStack.push(nextStateStr);
        
        this.restoreState(nextStateStr);
        this.selectedShape = null;
        this.render();
        this.updateUndoRedoButtons();
    }

    restoreState(stateStr) {
        const state = JSON.parse(stateStr);
        
        // 重构图形子类实例，确保继承方法完整
        this.shapes = state.shapes.map(s => {
            switch(s.type) {
                case 'line': return Object.assign(new LineShape(s.x1, s.y1, s.x2, s.y2, s.layer, s), s);
                case 'rect': return Object.assign(new RectShape(s.x, s.y, s.w, s.h, s.layer, s), s);
                case 'circle': return Object.assign(new CircleShape(s.cx, s.cy, s.r, s.layer, s), s);
                case 'text': return Object.assign(new TextShape(s.x, s.y, s.text, s.layer, s), s);
                case 'dim': return Object.assign(new DimShape(s.x1, s.y1, s.x2, s.y2, s.layer, s), s);
                case 'curve': return Object.assign(new CurveShape(s.points, s.layer, s), s);
                case 'block': return Object.assign(new BlockShape(s.blockType, s.cx, s.cy, s.w, s.h, s.angle, s.layer, s), s);
            }
        });
        
        this.layers = state.layers;
        this.activeLayer = state.activeLayer;
        updateLayersUI();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.classList.toggle('disabled', this.undoStack.length <= 1);
        if (redoBtn) redoBtn.classList.toggle('disabled', this.redoStack.length === 0);
    }

    // --- 5. 几何体碰撞判定 (Hit Testing) ---
    isPointNearLine(px, py, x1, y1, x2, y2, tolerance) {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2) < tolerance;
        
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
        return dist < tolerance;
    }

    findClickedShape(worldPt) {
        // tolerance 根据缩放动态调节，让高缩放时也能轻松点选（屏幕上恒定约为 8 像素）
        const tolerance = 8 / this.zoom;

        // 从最新的图形反向遍历（优先选择最上面的图形）
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const s = this.shapes[i];
            
            // 锁定或不可见的图层不可被选择
            if (!this.layers[s.layer] || !this.layers[s.layer].visible || this.layers[s.layer].locked) {
                continue;
            }

            if (s.type === 'line') {
                if (this.isPointNearLine(worldPt.x, worldPt.y, s.x1, s.y1, s.x2, s.y2, tolerance)) {
                    return s;
                }
            } else if (s.type === 'rect') {
                const xMin = Math.min(s.x, s.x + s.w);
                const xMax = Math.max(s.x, s.x + s.w);
                const yMin = Math.min(s.y, s.y + s.h);
                const yMax = Math.max(s.y, s.y + s.h);

                if (s.fill) {
                    // 如果有填充，点到内部即可选中
                    if (worldPt.x >= xMin && worldPt.x <= xMax && worldPt.y >= yMin && worldPt.y <= yMax) {
                        return s;
                    }
                } else {
                    // 无填充，则需靠近矩形四条边中的任意一条
                    if (this.isPointNearLine(worldPt.x, worldPt.y, xMin, yMin, xMax, yMin, tolerance) ||
                        this.isPointNearLine(worldPt.x, worldPt.y, xMax, yMin, xMax, yMax, tolerance) ||
                        this.isPointNearLine(worldPt.x, worldPt.y, xMax, yMax, xMin, yMax, tolerance) ||
                        this.isPointNearLine(worldPt.x, worldPt.y, xMin, yMax, xMin, yMin, tolerance)) {
                        return s;
                    }
                }
            } else if (s.type === 'circle') {
                const distToCenter = Math.sqrt((worldPt.x - s.cx) ** 2 + (worldPt.y - s.cy) ** 2);
                if (s.fill) {
                    if (distToCenter <= s.r) return s;
                } else {
                    if (Math.abs(distToCenter - s.r) < tolerance) return s;
                }
            } else if (s.type === 'text') {
                // 文本点击粗略碰撞区 (矩形包围盒)
                const textWidth = 60 / this.zoom; // 假定宽度
                const textHeight = 16 / this.zoom;
                if (worldPt.x >= s.x && worldPt.x <= s.x + textWidth &&
                    worldPt.y >= s.y - textHeight && worldPt.y <= s.y) {
                    return s;
                }
            } else if (s.type === 'dim') {
                // 尺寸标注选中线段或两个界线
                if (this.isPointNearLine(worldPt.x, worldPt.y, s.x1, s.y1, s.x2, s.y2, tolerance)) {
                    return s;
                }
            } else if (s.type === 'block') {
                // 块级点击碰撞判定 (使用矩形包围盒加容差)
                const pad = 10 / this.zoom;
                const halfW = s.w / 2;
                const halfH = s.h / 2;
                if (worldPt.x >= s.cx - halfW - pad && worldPt.x <= s.cx + halfW + pad &&
                    worldPt.y >= s.cy - halfH - pad && worldPt.y <= s.cy + halfH + pad) {
                    return s;
                }
            } else if (s.type === 'curve') {
                // 遍历曲线的相邻点拟合的线段进行点选碰撞判定
                for (let j = 0; j < s.points.length - 1; j++) {
                    if (this.isPointNearLine(worldPt.x, worldPt.y, s.points[j].x, s.points[j].y, s.points[j+1].x, s.points[j+1].y, tolerance)) {
                        return s;
                    }
                }
            }
        }
        return null;
    }

    // --- 6. 事件监听中心 ---
    initEventListeners() {
        const c = this.canvas;

        // 屏蔽画布默认右键菜单，实现平移
        c.addEventListener('contextmenu', e => e.preventDefault());

        // 鼠标按下事件
        c.addEventListener('mousedown', e => {
            const worldPt = this.screenToWorld(e.offsetX, e.offsetY);
            const snappedPt = this.getSnappedPoint(worldPt);

            // 1. 鼠标中键拖拽 或 选中工具下按住空格 + 左键拖拽 -> 平移画布
            if (e.button === 1 || e.button === 2 || (e.button === 0 && this.spacePressed)) {
                this.isPanning = true;
                this.lastMouseX = e.offsetX;
                this.lastMouseY = e.offsetY;
                c.style.cursor = 'grabbing';
                return;
            }

            // 2. 左键点击逻辑
            if (e.button === 0) {
                if (this.activeTool === 'select') {
                    // 优先检查是否点击了已选中线段/标注的端点控制柄，实现拉伸功能
                    if (this.selectedShape && (this.selectedShape.type === 'line' || this.selectedShape.type === 'dim')) {
                        const s = this.selectedShape;
                        const dist1 = Math.sqrt((worldPt.x - s.x1)**2 + (worldPt.y - s.y1)**2);
                        const dist2 = Math.sqrt((worldPt.x - s.x2)**2 + (worldPt.y - s.y2)**2);
                        const handleTol = 12 / this.zoom; // 屏幕像素容差

                        if (dist1 < handleTol) {
                            this.isStretchingEndpoint = true;
                            this.stretchEndpointIndex = 1;
                            this.dragOffset = { x: worldPt.x, y: worldPt.y };
                            this.render();
                            return;
                        } else if (dist2 < handleTol) {
                            this.isStretchingEndpoint = true;
                            this.stretchEndpointIndex = 2;
                            this.dragOffset = { x: worldPt.x, y: worldPt.y };
                            this.render();
                            return;
                        }
                    }

                    // 否则执行正常的选择与拖拽移动模式
                    const clicked = this.findClickedShape(worldPt);
                    if (clicked) {
                        this.selectedShape = clicked;
                        this.isDraggingShape = true;
                        this.dragOffset = {
                            x: worldPt.x,
                            y: worldPt.y
                        };
                        // 同步属性选择器界面
                        syncInspector(clicked);
                    } else {
                        this.selectedShape = null;
                        resetInspectorToDefault();
                    }
                    this.render();
                } else {
                    // 开始几何绘制模式
                    // 判断当前图层是否被锁定，如果被锁定无法绘制
                    if (this.layers[this.activeLayer].locked) {
                        document.getElementById('status-activity').innerText = '当前活动图层已锁定！请解锁后绘制';
                        return;
                    }

                    // 曲线手绘模式使用无吸附物理世界点坐标，其余几何体使用网格对齐坐标
                    this.drawingStartPoint = (this.activeTool === 'curve') ? worldPt : snappedPt;
                    if (this.activeTool === 'curve') {
                        this.activeCurvePoints = [this.drawingStartPoint];
                    }
                    document.getElementById('status-activity').innerText = '绘制中... 按 Esc 退出';
                }
            }
        });

        // 鼠标滑动事件
        c.addEventListener('mousemove', e => {
            const worldPt = this.screenToWorld(e.offsetX, e.offsetY);
            this.currentMouseWorld = worldPt;
            const snappedPt = this.getSnappedPoint(worldPt);

            // 更新状态栏上的坐标显示
            document.getElementById('coord-x').innerText = snappedPt.x.toFixed(2);
            document.getElementById('coord-y').innerText = (-snappedPt.y).toFixed(2); // CAD笛卡尔坐标Y向上

            // 1. 处理画布平移
            if (this.isPanning) {
                const dx = e.offsetX - this.lastMouseX;
                const dy = e.offsetY - this.lastMouseY;
                this.panX += dx;
                this.panY += dy;
                this.lastMouseX = e.offsetX;
                this.lastMouseY = e.offsetY;
                this.render();
                return;
            }

            // 2. 选中图形后进行拖拽移动
            if (this.activeTool === 'select' && this.isDraggingShape && this.selectedShape) {
                const dx = worldPt.x - this.dragOffset.x;
                const dy = worldPt.y - this.dragOffset.y;
                
                // 应用移动偏移
                const s = this.selectedShape;
                if (s.type === 'line' || s.type === 'dim') {
                    s.x1 += dx; s.y1 += dy;
                    s.x2 += dx; s.y2 += dy;
                } else if (s.type === 'rect') {
                    s.x += dx; s.y += dy;
                } else if (s.type === 'circle') {
                    s.cx += dx; s.cy += dy;
                } else if (s.type === 'text') {
                    s.x += dx; s.y += dy;
                } else if (s.type === 'block') {
                    s.cx += dx;
                    s.cy += dy;
                } else if (s.type === 'curve') {
                    s.points.forEach(pt => {
                        pt.x += dx;
                        pt.y += dy;
                    });
                }
                
                this.dragOffset = { x: worldPt.x, y: worldPt.y };
                this.render();
                return;
            }

            // 2b. 选中线段/标注后拉伸端点控制柄
            if (this.activeTool === 'select' && this.isStretchingEndpoint && this.selectedShape) {
                const s = this.selectedShape;
                const targetPt = this.snapToGrid ? snappedPt : worldPt;

                if (this.stretchEndpointIndex === 1) {
                    s.x1 = targetPt.x;
                    s.y1 = targetPt.y;
                } else if (this.stretchEndpointIndex === 2) {
                    s.x2 = targetPt.x;
                    s.y2 = targetPt.y;
                }

                this.render();
                return;
            }

            // 3. 处于绘制状态，更新预览
            if (this.drawingStartPoint) {
                if (this.activeTool === 'curve') {
                    // 自由手绘，采样当前轨迹点追加进数组，并按缩放等级动态调节采样精度，防抖去重
                    const lastPt = this.activeCurvePoints[this.activeCurvePoints.length - 1];
                    const dist = Math.sqrt((worldPt.x - lastPt.x)**2 + (worldPt.y - lastPt.y)**2);
                    if (dist > 3 / this.zoom) {
                        this.activeCurvePoints.push(worldPt);
                    }
                }
                this.render(); // 循环清空渲染，从而绘制当前的临时图形
            } else {
                // 如果只是移动鼠标，也需要渲染，来动态更新网格吸附的青色靶心
                if (this.snapToGrid) {
                    this.render();
                }

                // 4. 鼠标悬停在已选中线段端点上时改变光标样式以提示拉伸
                if (this.activeTool === 'select' && this.selectedShape && !this.isDraggingShape && !this.isPanning && !this.isStretchingEndpoint) {
                    const s = this.selectedShape;
                    if (s.type === 'line' || s.type === 'dim') {
                        const dist1 = Math.sqrt((worldPt.x - s.x1)**2 + (worldPt.y - s.y1)**2);
                        const dist2 = Math.sqrt((worldPt.x - s.x2)**2 + (worldPt.y - s.y2)**2);
                        const handleTol = 12 / this.zoom;
                        if (dist1 < handleTol || dist2 < handleTol) {
                            c.style.cursor = 'pointer';
                        } else {
                            c.style.cursor = 'default';
                        }
                    } else {
                        c.style.cursor = 'default';
                    }
                }
            }
        });

        // 鼠标松开事件
        c.addEventListener('mouseup', e => {
            if (this.isPanning) {
                this.isPanning = false;
                c.style.cursor = 'default';
                return;
            }

            if (this.activeTool === 'select' && this.isDraggingShape) {
                this.isDraggingShape = false;
                this.saveState(); // 拖动完成后记录状态
                return;
            }

            if (this.activeTool === 'select' && this.isStretchingEndpoint) {
                this.isStretchingEndpoint = false;
                this.stretchEndpointIndex = null;
                this.saveState(); // 拉伸完成后记录状态
                return;
            }

            // 几何图形绘制结束
            if (e.button === 0 && this.drawingStartPoint) {
                const worldPt = this.screenToWorld(e.offsetX, e.offsetY);
                const snappedPt = this.getSnappedPoint(worldPt);

                // 避免绘制零面积或零长度的废图形
                const dx = snappedPt.x - this.drawingStartPoint.x;
                const dy = snappedPt.y - this.drawingStartPoint.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                let newShape = null;

                if (this.activeTool === 'curve') {
                    if (this.activeCurvePoints && this.activeCurvePoints.length >= 2) {
                        newShape = new CurveShape(this.activeCurvePoints, this.activeLayer, this.defaultProperties);
                    }
                } else if (this.activeTool === 'line' && dist > 1) {
                    newShape = new LineShape(this.drawingStartPoint.x, this.drawingStartPoint.y, snappedPt.x, snappedPt.y, this.activeLayer, this.defaultProperties);
                } else if (this.activeTool === 'rect' && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
                    newShape = new RectShape(this.drawingStartPoint.x, this.drawingStartPoint.y, dx, dy, this.activeLayer, this.defaultProperties);
                } else if (this.activeTool === 'circle' && dist > 1) {
                    newShape = new CircleShape(this.drawingStartPoint.x, this.drawingStartPoint.y, dist, this.activeLayer, this.defaultProperties);
                } else if (this.activeTool === 'text') {
                    const txt = this.defaultProperties.textValue || '标注文字';
                    newShape = new TextShape(snappedPt.x, snappedPt.y, txt, this.activeLayer, this.defaultProperties);
                } else if (this.activeTool === 'dim' && dist > 1) {
                    // 使用标注图层
                    newShape = new DimShape(this.drawingStartPoint.x, this.drawingStartPoint.y, snappedPt.x, snappedPt.y, 'Dimensions', this.defaultProperties);
                }

                if (newShape) {
                    this.shapes.push(newShape);
                    this.saveState();
                    this.selectedShape = newShape; // 自动选中刚画好的图形
                    syncInspector(newShape);
                }

                this.drawingStartPoint = null;
                document.getElementById('status-activity').innerText = '绘制完成';
                this.render();
            }
        });

        // 鼠标滚轮缩放事件（以光标为中心）
        c.addEventListener('wheel', e => {
            e.preventDefault();
            
            // 获取缩放前的世界坐标
            const mouseBeforeZoom = this.screenToWorld(e.offsetX, e.offsetY);
            
            // 每次滚轮滚动，缩放比例乘/除 1.12
            const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
            let targetZoom = this.zoom * factor;
            
            // 夹紧缩放上限与下限
            targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
            
            this.zoom = targetZoom;
            
            // 重新平移视口，使得缩放后，鼠标下方的那个点仍然保持在相同的屏幕位置
            this.panX = e.offsetX - mouseBeforeZoom.x * this.zoom;
            this.panY = e.offsetY - mouseBeforeZoom.y * this.zoom;

            document.getElementById('zoom-factor').innerText = Math.round(this.zoom * 100) + '%';
            this.render();
        }, { passive: false });

        // 键盘按键监听 (Space 平移, Delete 删除, Ctrl+Z 撤销, Ctrl+Y 重做)
        window.addEventListener('keydown', e => {
            if (e.key === ' ' || e.code === 'Space') {
                // 如果用户当前没有在输入框里打字
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
                    e.preventDefault();
                    if (!this.spacePressed) {
                        this.spacePressed = true;
                        c.style.cursor = 'grab';
                    }
                }
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedShape && document.activeElement.tagName !== 'INPUT') {
                    this.shapes = this.shapes.filter(s => s.id !== this.selectedShape.id);
                    this.selectedShape = null;
                    resetInspectorToDefault();
                    this.saveState();
                    this.render();
                }
            }

            if (e.key === 'Escape') {
                this.drawingStartPoint = null;
                this.selectedShape = null;
                resetInspectorToDefault();
                document.getElementById('status-activity').innerText = '准备就绪';
                this.render();
            }

            // Ctrl+Z 撤销
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Y 重做
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.redo();
            }
        });

        window.addEventListener('keyup', e => {
            if (e.key === ' ' || e.code === 'Space') {
                this.spacePressed = false;
                if (!this.isPanning) {
                    c.style.cursor = 'default';
                }
            }
        });

        // 监听粘贴事件自动进行截图矢量化 CAD 线条转换
        window.addEventListener('paste', e => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    this.vectorizeImage(blob);
                    break;
                }
            }
        });
    }

    // --- 7. 渲染总流程 ---
    render() {
        // 清空画布并绘制背景色
        this.ctx.fillStyle = this.theme === 'light' ? '#ffffff' : '#0d0e15';
        this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

        // 7a. 在最底层绘制无级网格
        this.drawInfiniteGrid();

        // 7b. 应用视口缩放平移矩阵变换
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // 7c. 依次绘制每一个图层的图形
        for (const s of this.shapes) {
            const layer = this.layers[s.layer];
            if (layer && layer.visible) {
                this.drawShape(s);
            }
        }

        // 7d. 绘制当前正在拖拽出的预览图形
        this.drawDrawingPreview();

        // 7e. 绘制被选中图形的发光高亮外边框
        this.drawSelectionHighlight();

        this.ctx.restore();

        // 7f. 绘制吸附靶心（非平移非绘制且开启对齐时）
        if (this.snapToGrid && !this.isPanning && this.activeTool !== 'select') {
            this.drawSnapTarget();
        }
    }

    // --- 7a. 核心算法：绘制无限动态辅助网格 ---
    drawInfiniteGrid() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const ctx = this.ctx;

        // 根据当前的 zoom 来计算网格密度（防止缩放过小时网格过密，缩放过大时网格过疏）
        let step = this.gridSize; // 20
        const screenStep = step * this.zoom;

        if (screenStep < 15) {
            step = this.gridSize * 5; // 100mm 一格
        }
        if (screenStep * 5 < 15) {
            step = this.gridSize * 25; // 500mm 一格
        }
        if (screenStep > 120) {
            step = this.gridSize / 2; // 10mm 一格
        }

        // 轴的屏幕像素位置
        const originScreenX = this.panX;
        const originScreenY = this.panY;

        ctx.strokeStyle = this.theme === 'light' ? '#f0f0f0' : '#1b1d28';
        ctx.lineWidth = 1;

        // 绘制垂直网格线
        const startX = Math.floor(-this.panX / (step * this.zoom)) * step;
        const endX = Math.ceil((width - this.panX) / (step * this.zoom)) * step;

        for (let wx = startX; wx <= endX; wx += step) {
            const sx = wx * this.zoom + this.panX;
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
            ctx.stroke();
        }

        // 绘制水平网格线
        const startY = Math.floor(-this.panY / (step * this.zoom)) * step;
        const endY = Math.ceil((height - this.panY) / (step * this.zoom)) * step;

        for (let wy = startY; wy <= endY; wy += step) {
            const sy = wy * this.zoom + this.panY;
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
            ctx.stroke();
        }

        // 绘制 CAD 的十字主轴坐标线 (X 轴以红/蓝区分，此处以荧光青和暗绿代表原点参考)
        ctx.strokeStyle = this.theme === 'light' ? '#cbd5e1' : '#2b3042';
        ctx.lineWidth = 1.5;

        // Y 轴
        if (originScreenX >= 0 && originScreenX <= width) {
            ctx.beginPath();
            ctx.moveTo(originScreenX, 0);
            ctx.lineTo(originScreenX, height);
            ctx.stroke();
        }
        // X 轴
        if (originScreenY >= 0 && originScreenY <= height) {
            ctx.beginPath();
            ctx.moveTo(0, originScreenY);
            ctx.lineTo(width, originScreenY);
            ctx.stroke();
        }
    }

    // --- 7c. 图形渲染分发器 ---
    drawShape(s, isPreview = false) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = this.resolveColor(s.stroke);
        ctx.lineWidth = s.strokeWidth;
        
        // 线条样式
        if (s.strokeStyle === 'dashed') {
            ctx.setLineDash([8, 6]);
        } else if (s.strokeStyle === 'dotted') {
            ctx.setLineDash([2, 4]);
        } else {
            ctx.setLineDash([]);
        }

        if (s.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
        } else if (s.type === 'rect') {
            ctx.beginPath();
            ctx.rect(s.x, s.y, s.w, s.h);
            ctx.stroke();
            if (s.fill) {
                ctx.fillStyle = this.resolveColor(s.fill);
                ctx.fill();
            }
        } else if (s.type === 'circle') {
            ctx.beginPath();
            ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
            ctx.stroke();
            if (s.fill) {
                ctx.fillStyle = this.resolveColor(s.fill);
                ctx.fill();
            }
        } else if (s.type === 'text') {
            // 文字渲染需要注意抗缩放，防止文字因过大过小模糊
            ctx.fillStyle = this.resolveColor(s.stroke);
            ctx.font = `bold 14px 'Inter', sans-serif`;
            ctx.textBaseline = 'bottom';
            ctx.fillText(s.text, s.x, s.y);
        } else if (s.type === 'dim') {
            this.drawDimensionLine(s.x1, s.y1, s.x2, s.y2, this.resolveColor(s.stroke));
        } else if (s.type === 'block') {
            // 🧱 渲染高清晰度的 CAD 标准二维图块
            ctx.save();
            ctx.translate(s.cx, s.cy);
            ctx.rotate(s.angle);
            renderBlockSymbol(ctx, s.blockType, s.w, s.h, s.strokeWidth, this.resolveColor(s.stroke));
            ctx.restore();
        } else if (s.type === 'curve') {
            if (s.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            
            // 使用二阶贝塞尔曲线平滑插值绘制样条曲线
            for (let i = 1; i < s.points.length - 1; i++) {
                const xc = (s.points[i].x + s.points[i+1].x) / 2;
                const yc = (s.points[i].y + s.points[i+1].y) / 2;
                ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, xc, yc);
            }
            ctx.lineTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y);
            ctx.stroke();
        }

        ctx.restore();
    }

    // --- CAD 核心算法：带箭头与文字的测量标注线 ---
    drawDimensionLine(x1, y1, x2, y2, strokeColor) {
        const ctx = this.ctx;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx*dx + dy*dy);
        if (length < 1) return;

        // 计算夹角与单位向量
        const angle = Math.atan2(dy, dx);
        const ux = dx / length;
        const uy = dy / length;

        // 法线向量（用于将标注线平移出去，CAD一般有偏移线）
        const nx = -uy;
        const ny = ux;
        const offset = 25; // 偏离距离 25 物理单位

        const ax1 = x1 + nx * offset;
        const ay1 = y1 + ny * offset;
        const ax2 = x2 + nx * offset;
        const ay2 = y2 + ny * offset;

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;
        ctx.lineWidth = 1.5;

        // 1. 绘制引线 (Extension Lines)
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(ax1, ay1);
        ctx.moveTo(x2, y2);
        ctx.lineTo(ax2, ay2);
        ctx.stroke();

        // 2. 绘制标注主轴线 (Dimension Line)
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(ax1, ay1);
        ctx.lineTo(ax2, ay2);
        ctx.stroke();

        // 3. 绘制两个端点箭头
        const arrowLength = 8;
        const arrowWidth = 3.5;

        // 箭头 1 (指向起点)
        ctx.beginPath();
        ctx.moveTo(ax1, ay1);
        ctx.lineTo(ax1 + (ux * arrowLength) + (nx * arrowWidth), ay1 + (uy * arrowLength) + (ny * arrowWidth));
        ctx.lineTo(ax1 + (ux * arrowLength) - (nx * arrowWidth), ay1 + (uy * arrowLength) - (ny * arrowWidth));
        ctx.closePath();
        ctx.fill();

        // 箭头 2 (指向终点)
        ctx.beginPath();
        ctx.moveTo(ax2, ay2);
        ctx.lineTo(ax2 - (ux * arrowLength) + (nx * arrowWidth), ay2 - (uy * arrowLength) + (ny * arrowWidth));
        ctx.lineTo(ax2 - (ux * arrowLength) - (nx * arrowWidth), ay2 - (uy * arrowLength) - (ny * arrowWidth));
        ctx.closePath();
        ctx.fill();

        // 4. 绘制文字 (显示距离 mm)
        const mx = (ax1 + ax2) / 2;
        const my = (ay1 + ay2) / 2;

        ctx.save();
        ctx.translate(mx, my);
        // 让文字跟着线倾斜，但防止上下颠倒
        let textAngle = angle;
        if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
            textAngle += Math.PI;
        }
        ctx.rotate(textAngle);
        
        ctx.font = `${11}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // 渲染文本（在标注线上方 3 像素位置，显示实际物理尺寸）
        ctx.fillText(length.toFixed(1) + ' mm', 0, -3);
        ctx.restore();

        ctx.restore();
    }

    // --- 7d. 绘制预览图形 ---
    drawDrawingPreview() {
        if (!this.drawingStartPoint) return;
        
        const start = this.drawingStartPoint;
        const end = this.getSnappedPoint(this.currentMouseWorld);

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // 创建临时预览对象
        let preview = null;
        const previewProps = Object.assign({}, this.defaultProperties, { stroke: '#4facfe', strokeWidth: 1.5, strokeStyle: 'dashed' });

        if (this.activeTool === 'curve') {
            if (this.activeCurvePoints && this.activeCurvePoints.length >= 2) {
                preview = new CurveShape(this.activeCurvePoints, this.activeLayer, previewProps);
            }
        } else if (this.activeTool === 'line') {
            preview = new LineShape(start.x, start.y, end.x, end.y, this.activeLayer, previewProps);
        } else if (this.activeTool === 'rect') {
            preview = new RectShape(start.x, start.y, dx, dy, this.activeLayer, previewProps);
        } else if (this.activeTool === 'circle') {
            const dist = Math.sqrt(dx*dx + dy*dy);
            preview = new CircleShape(start.x, start.y, dist, this.activeLayer, previewProps);
        } else if (this.activeTool === 'dim') {
            preview = new DimShape(start.x, start.y, end.x, end.y, 'Dimensions', previewProps);
        }

        if (preview) {
            this.drawShape(preview, true);
        }
    }

    // --- 7e. 绘制被选中图形的高亮虚线盒 ---
    drawSelectionHighlight() {
        if (!this.selectedShape || this.activeTool !== 'select') return;

        const s = this.selectedShape;
        const ctx = this.ctx;

        let xMin, xMax, yMin, yMax;

        if (s.type === 'line' || s.type === 'dim') {
            xMin = Math.min(s.x1, s.x2); xMax = Math.max(s.x1, s.x2);
            yMin = Math.min(s.y1, s.y2); yMax = Math.max(s.y1, s.y2);
        } else if (s.type === 'block') {
            xMin = s.cx - s.w/2; xMax = s.cx + s.w/2;
            yMin = s.cy - s.h/2; yMax = s.cy + s.h/2;
        } else if (s.type === 'curve') {
            xMin = Math.min(...s.points.map(p => p.x));
            xMax = Math.max(...s.points.map(p => p.x));
            yMin = Math.min(...s.points.map(p => p.y));
            yMax = Math.max(...s.points.map(p => p.y));
        } else if (s.type === 'rect') {
            xMin = Math.min(s.x, s.x + s.w); xMax = Math.max(s.x, s.x + s.w);
            yMin = Math.min(s.y, s.y + s.h); yMax = Math.max(s.y, s.y + s.h);
        } else if (s.type === 'circle') {
            xMin = s.cx - s.r; xMax = s.cx + s.r;
            yMin = s.cy - s.r; yMax = s.cy + s.r;
        } else if (s.type === 'text') {
            xMin = s.x; xMax = s.x + 60 / this.zoom;
            yMin = s.y - 16 / this.zoom; yMax = s.y;
        }

        // 绘制半透明发光高亮包围盒
        ctx.save();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1 / this.zoom; // 无论怎么缩放，虚线包围盒在屏幕上只占 1 像素粗
        ctx.setLineDash([4, 4]);
        
        const pad = 6 / this.zoom; // 扩充 6px 的视觉边距
        ctx.beginPath();
        ctx.rect(xMin - pad, yMin - pad, (xMax - xMin) + pad * 2, (yMax - yMin) + pad * 2);
        ctx.stroke();

        // 绘制控制节点小方块 (CAD 特色蓝点)
        ctx.fillStyle = '#00f2fe';
        const boxSize = 6 / this.zoom;
        const drawHandle = (x, y) => {
            ctx.fillRect(x - boxSize/2, y - boxSize/2, boxSize, boxSize);
            ctx.strokeRect(x - boxSize/2, y - boxSize/2, boxSize, boxSize);
        };

        if (s.type === 'line' || s.type === 'dim') {
            drawHandle(s.x1, s.y1);
            drawHandle(s.x2, s.y2);
            drawHandle((s.x1 + s.x2)/2, (s.y1 + s.y2)/2);
        } else if (s.type === 'curve') {
            drawHandle(s.points[0].x, s.points[0].y);
            drawHandle(s.points[s.points.length-1].x, s.points[s.points.length-1].y);
        } else {
            drawHandle(xMin, yMin);
            drawHandle(xMax, yMin);
            drawHandle(xMin, yMax);
            drawHandle(xMax, yMax);
        }

        ctx.restore();
    }

    // --- 7f. 绘制吸附靶心（青色圆圈与十字架） ---
    drawSnapTarget() {
        const worldPt = this.currentMouseWorld;
        const snappedPt = this.getSnappedPoint(worldPt);
        const screenPt = this.worldToScreen(snappedPt.x, snappedPt.y);

        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
        ctx.lineWidth = 1.5;

        // 绘制圆圈
        ctx.beginPath();
        ctx.arc(screenPt.x, screenPt.y, 6, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制中央小十字
        ctx.beginPath();
        ctx.moveTo(screenPt.x - 10, screenPt.y);
        ctx.lineTo(screenPt.x + 10, screenPt.y);
        ctx.moveTo(screenPt.x, screenPt.y - 10);
        ctx.lineTo(screenPt.x, screenPt.y + 10);
        ctx.stroke();

        ctx.restore();
    }

    // --- 7g. 智能截图粘贴矢量化转换引擎 V2 (Architecture-Aware Vectorizer) ---
    // 辅助方法：水平扫描线聚类
    _clusterHRuns(group, output, minRun, mergeGap = 15) {
        const ys = group.map(r => r.y);
        ys.sort((a, b) => a - b);
        const medianY = ys[Math.floor(ys.length / 2)];
        const ranges = group.map(r => ({ x1: r.x1, x2: r.x2 }));
        ranges.sort((a, b) => a.x1 - b.x1);
        const merged = [{ ...ranges[0] }];
        for (let i = 1; i < ranges.length; i++) {
            const last = merged[merged.length - 1];
            if (ranges[i].x1 <= last.x2 + mergeGap) {
                last.x2 = Math.max(last.x2, ranges[i].x2);
            } else {
                merged.push({ ...ranges[i] });
            }
        }
        const valid = merged.filter(s => s.x2 - s.x1 >= minRun);
        if (valid.length > 0) output.push({ y: medianY, segs: valid });
    }

    // 辅助方法：垂直扫描线聚类
    _clusterVRuns(group, output, minRun, mergeGap = 15) {
        const xs = group.map(r => r.x);
        xs.sort((a, b) => a - b);
        const medianX = xs[Math.floor(xs.length / 2)];
        const ranges = group.map(r => ({ y1: r.y1, y2: r.y2 }));
        ranges.sort((a, b) => a.y1 - b.y1);
        const merged = [{ ...ranges[0] }];
        for (let i = 1; i < ranges.length; i++) {
            const last = merged[merged.length - 1];
            if (ranges[i].y1 <= last.y2 + mergeGap) {
                last.y2 = Math.max(last.y2, ranges[i].y2);
            } else {
                merged.push({ ...ranges[i] });
            }
        }
        const valid = merged.filter(s => s.y2 - s.y1 >= minRun);
        if (valid.length > 0) output.push({ x: medianX, segs: valid });
    }

    // 辅助方法：端点吸附——将墙线端点对齐到最近的交叉墙线
    _snapWallEndpoints(hWalls, vWalls, tolerance) {
        // 水平墙段端点吸附到垂直墙线
        hWalls.forEach(hw => {
            hw.segs.forEach(seg => {
                vWalls.forEach(vw => {
                    if (Math.abs(seg.x1 - vw.x) < tolerance) {
                        const inRange = vw.segs.some(vs => hw.y >= vs.y1 - tolerance && hw.y <= vs.y2 + tolerance);
                        if (inRange) seg.x1 = vw.x;
                    }
                    if (Math.abs(seg.x2 - vw.x) < tolerance) {
                        const inRange = vw.segs.some(vs => hw.y >= vs.y1 - tolerance && hw.y <= vs.y2 + tolerance);
                        if (inRange) seg.x2 = vw.x;
                    }
                });
            });
        });
        // 垂直墙段端点吸附到水平墙线
        vWalls.forEach(vw => {
            vw.segs.forEach(seg => {
                hWalls.forEach(hw => {
                    if (Math.abs(seg.y1 - hw.y) < tolerance) {
                        const inRange = hw.segs.some(hs => vw.x >= hs.x1 - tolerance && vw.x <= hs.x2 + tolerance);
                        if (inRange) seg.y1 = hw.y;
                    }
                    if (Math.abs(seg.y2 - hw.y) < tolerance) {
                        const inRange = hw.segs.some(hs => vw.x >= hs.x1 - tolerance && vw.x <= hs.x2 + tolerance);
                        if (inRange) seg.y2 = hw.y;
                    }
                });
            });
        });
    }

    async vectorizeImage(blob) {
        this.showToast('正在读取剪贴板图纸截图...', 'loading');

        const getPerpDist = (pt, lStart, lEnd) => {
            const dx = lEnd.x - lStart.x, dy = lEnd.y - lStart.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag === 0) return Math.sqrt((pt.x - lStart.x)**2 + (pt.y - lStart.y)**2);
            return Math.abs(dy * pt.x - dx * pt.y + lEnd.x * lStart.y - lEnd.y * lStart.x) / mag;
        };

        const simplifyRDP = (pts, epsilon) => {
            if (pts.length < 3) return pts;
            let maxDist = 0, index = 0;
            const end = pts.length - 1;
            for (let i = 1; i < end; i++) {
                const d = getPerpDist(pts[i], pts[0], pts[end]);
                if (d > maxDist) { index = i; maxDist = d; }
            }
            if (maxDist > epsilon) {
                return simplifyRDP(pts.slice(0, index + 1), epsilon).slice(0, -1).concat(simplifyRDP(pts.slice(index), epsilon));
            } else return [pts[0], pts[end]];
        };

        try {
            // 🌟 自动切换到白图纸主题
            this.theme = 'light';
            document.body.classList.add('light-theme');

            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

            this.showToast('图片载入成功，正在进行建筑语义分析...', 'loading');

            const offscreenCanvas = document.createElement('canvas');
            const offscreenCtx = offscreenCanvas.getContext('2d');
            const maxDimLimit = 1000;
            let w = img.width, h = img.height;
            if (w > maxDimLimit || h > maxDimLimit) {
                if (w > h) { h = Math.round((h * maxDimLimit) / w); w = maxDimLimit; }
                else { w = Math.round((w * maxDimLimit) / h); h = maxDimLimit; }
            }
            offscreenCanvas.width = w; offscreenCanvas.height = h;
            offscreenCtx.drawImage(img, 0, 0, w, h);

            // 智能微调面板显隐与初始化
            const tuningPanel = document.getElementById('vectorizer-tuning-panel');
            if (tuningPanel) tuningPanel.style.display = 'block';
            const aiPanel = document.getElementById('vectorizer-ai-panel');
            if (aiPanel) aiPanel.style.display = 'block';

            const isNewImage = !this.lastPastedBlob || this.lastPastedBlob !== blob;
            this.lastPastedBlob = blob;

            if (isNewImage) {
                const currentDim = Math.max(w, h);
                const scale = currentDim / 800;
                
                const optimalWallThick = Math.max(6, Math.min(60, Math.round(20 * scale)));
                const optimalMinRun = Math.max(6, Math.min(50, Math.round(18 * scale)));
                const optimalSnap = Math.max(10, Math.min(60, Math.round(30 * scale)));
                
                const sensInput = document.getElementById('tune-sens');
                const wallThickInput = document.getElementById('tune-wall-thick');
                const minRunInput = document.getElementById('tune-min-run');
                const snapInput = document.getElementById('tune-snap');
                
                if (sensInput) sensInput.value = 0; // 自动
                if (document.getElementById('val-sens')) document.getElementById('val-sens').innerText = '自动';
                
                if (wallThickInput) {
                    wallThickInput.value = optimalWallThick;
                    const wtValEl = document.getElementById('val-wall-thick');
                    if (wtValEl) wtValEl.innerText = optimalWallThick + 'px';
                }
                if (minRunInput) {
                    minRunInput.value = optimalMinRun;
                    const mrValEl = document.getElementById('val-min-run');
                    if (mrValEl) mrValEl.innerText = optimalMinRun + 'px';
                }
                if (snapInput) {
                    snapInput.value = optimalSnap;
                    const snValEl = document.getElementById('val-snap');
                    if (snValEl) snValEl.innerText = optimalSnap + 'px';
                }
            }

            const sensVal = parseInt(document.getElementById('tune-sens')?.value || '0', 10);
            const wallThickVal = parseInt(document.getElementById('tune-wall-thick')?.value || '20', 10);
            const minRunVal = parseInt(document.getElementById('tune-min-run')?.value || '18', 10);
            const snapVal = parseInt(document.getElementById('tune-snap')?.value || '30', 10);

            const imgData = offscreenCtx.getImageData(0, 0, w, h);
            const dd = imgData.data;

            // ===== 第一阶段：Otsu 自适应二值化与直方图对比度拉伸 =====
            const grayValues = new Uint8Array(w * h);
            let minG = 255, maxG = 0;
            for (let i = 0; i < dd.length; i += 4) {
                const gray = Math.round(0.299 * dd[i] + 0.587 * dd[i+1] + 0.114 * dd[i+2]);
                grayValues[i / 4] = gray;
                if (gray < minG) minG = gray;
                if (gray > maxG) maxG = gray;
            }

            // 对比度自适应拉伸归一化，最大化黑白边缘灰度动态范围
            const histogram = new Array(256).fill(0);
            if (maxG > minG) {
                const range = maxG - minG;
                for (let i = 0; i < grayValues.length; i++) {
                    const stretched = Math.round((grayValues[i] - minG) / range * 255);
                    grayValues[i] = stretched;
                    histogram[stretched]++;
                }
            } else {
                for (let i = 0; i < grayValues.length; i++) {
                    histogram[grayValues[i]]++;
                }
            }

            const totalPixels = w * h;
            let graySum = 0;
            for (let t = 0; t < 256; t++) graySum += t * histogram[t];
            let sumB = 0, wBx = 0, wFx = 0, maxVar = 0, otsuTh = 128;
            for (let t = 0; t < 256; t++) {
                wBx += histogram[t]; if (wBx === 0) continue;
                wFx = totalPixels - wBx; if (wFx === 0) break;
                sumB += t * histogram[t];
                const mB = sumB / wBx, mF = (graySum - sumB) / wFx;
                const v = wBx * wFx * (mB - mF) * (mB - mF);
                if (v > maxVar) { maxVar = v; otsuTh = t; }
            }

            const bgCorners = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
            let bgS = 0; bgCorners.forEach(ci => bgS += grayValues[ci]);
            const isDarkBg = (bgS / 4) < otsuTh;

            const binaryArr = new Uint8Array(totalPixels);
            const actualThreshold = sensVal > 0 ? sensVal : otsuTh;
            for (let i = 0; i < totalPixels; i++) {
                binaryArr[i] = isDarkBg ? (grayValues[i] > actualThreshold ? 1 : 0) : (grayValues[i] < actualThreshold ? 1 : 0);
            }

            // ===== 第一阶段后期：自适应平滑与补线（专门针对微信截图/PDF抗锯齿断裂线条） =====
            const cleanArr = new Uint8Array(totalPixels);
            
            // 步骤 1：横纵向缝隙智能桥接（解决微信 PDF 截图因像素渲染产生的细微虚线和断点）
            const tempBinary = new Uint8Array(binaryArr);
            
            // 进行 2 轮缝隙填补（支持最多 2px 级别的断点连接）
            for (let pass = 0; pass < 2; pass++) {
                for (let y = 2; y < h - 2; y++) {
                    for (let x = 2; x < w - 2; x++) {
                        const ci = y * w + x;
                        if (tempBinary[ci] === 0) {
                            // 水平方向桥接: [1, 0, 1] 或 [1, 0, 0, 1]
                            const left1 = tempBinary[ci - 1], right1 = tempBinary[ci + 1];
                            const left2 = tempBinary[ci - 2], right2 = tempBinary[ci + 2];
                            
                            // 垂直方向桥接: [1, 0, 1] 或 [1, 0, 0, 1]
                            const top1 = tempBinary[ci - w], bottom1 = tempBinary[ci + w];
                            const top2 = tempBinary[ci - 2 * w], bottom2 = tempBinary[ci + 2 * w];

                            if ((left1 === 1 && right1 === 1) || 
                                (left1 === 1 && right2 === 1 && tempBinary[ci + 1] === 0) ||
                                (left2 === 1 && right2 === 1 && tempBinary[ci - 1] === 0)) {
                                tempBinary[ci] = 1;
                            } else if ((top1 === 1 && bottom1 === 1) ||
                                       (top1 === 1 && bottom2 === 1 && tempBinary[ci + w] === 0) ||
                                       (top2 === 1 && bottom1 === 1 && tempBinary[ci - w] === 0)) {
                                tempBinary[ci] = 1;
                            }
                        }
                    }
                }
            }

            // 步骤 2：保护端点的形态学滤波（去除孤立随机噪点，但保留连续的细墙线）
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const ci = y * w + x;
                    if (tempBinary[ci] === 0) continue;

                    // 计算 3x3 邻域的前景像素数量
                    let nb = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            if (tempBinary[(y + dy) * w + (x + dx)] === 1) nb++;
                        }
                    }

                    // 微信 PDF 截图的线条可能只有 1 像素宽。如果它有至少 2 个邻居，我们保留它。
                    if (nb >= 2) {
                        cleanArr[ci] = 1;
                    } else if (nb === 1) {
                        // 只有一个邻居时，检查 5x5 领域是否有超过 3 个像素（说明它是一个线段的端点，而非孤立噪声点）
                        let nb5x5 = 0;
                        const r = 2;
                        for (let dy = -r; dy <= r; dy++) {
                            for (let dx = -r; dx <= r; dx++) {
                                const nx = x + dx, ny = y + dy;
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    if (tempBinary[ny * w + nx] === 1) nb5x5++;
                                }
                            }
                        }
                        cleanArr[ci] = nb5x5 >= 3 ? 1 : 0;
                    } else {
                        cleanArr[ci] = 0; // 0 个邻居，绝对是孤立噪声点，清除！
                    }
                }
            }

            // ===== 第二阶段：八邻域轮廓追踪 + RDP 路径简化 =====
            const MIN_RUN = minRunVal;
            const GAP_BRIDGE = Math.max(3, Math.round(minRunVal / 3));
            const WALL_THICK = wallThickVal;
            const mergeGap = Math.max(6, Math.round(wallThickVal * 0.75));

            const visited = new Uint8Array(totalPixels);
            const paths = [];
            const idx = (px, py) => py * w + px;

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    if (cleanArr[idx(x, y)] === 1 && !visited[idx(x, y)]) {
                        const path = [];
                        let cx = x, cy = y;
                        path.push({ x: cx, y: cy });
                        visited[idx(cx, cy)] = 1;

                        let tracing = true;
                        while (tracing) {
                            let foundNeighbor = false;
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    if (dx === 0 && dy === 0) continue;
                                    const nx = cx + dx;
                                    const ny = cy + dy;
                                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                        const nidx = idx(nx, ny);
                                        if (cleanArr[nidx] === 1 && !visited[nidx]) {
                                            cx = nx; cy = ny;
                                            path.push({ x: cx, y: cy });
                                            visited[nidx] = 1;
                                            foundNeighbor = true;
                                            break;
                                        }
                                    }
                                }
                                if (foundNeighbor) break;
                            }
                            if (!foundNeighbor) tracing = false;
                        }
                        // 过滤噪声碎片线段长度
                        if (path.length >= Math.max(8, Math.round(MIN_RUN * 0.6))) {
                            paths.push(path);
                        }
                    }
                }
            }

            const simplifiedPaths = paths.map(path => simplifyRDP(path, 4.5));

            // ===== 第三阶段：正交线（墙体）与细节线（家具、斜线、圆弧）的自适应分离与聚类 =====
            const orthogonalLines = [];
            const detailLines = [];

            simplifiedPaths.forEach(path => {
                for (let j = 0; j < path.length - 1; j++) {
                    const seg = { x1: path[j].x, y1: path[j].y, x2: path[j+1].x, y2: path[j+1].y };
                    const segLen = Math.sqrt((seg.x2-seg.x1)**2 + (seg.y2-seg.y1)**2);
                    if (segLen < 6) continue;

                    const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
                    const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
                    
                    let isOrtho = false;
                    const tol = 15; // 正交角度容差 15°
                    let snappedSeg = { ...seg };

                    if (angle < tol || Math.abs(angle - 180) < tol) {
                        // 水平墙线
                        const avgY = (seg.y1 + seg.y2) / 2;
                        snappedSeg.y1 = snappedSeg.y2 = avgY;
                        isOrtho = true;
                    } else if (Math.abs(angle - 90) < tol) {
                        // 垂直墙线
                        const avgX = (seg.x1 + seg.x2) / 2;
                        snappedSeg.x1 = snappedSeg.x2 = avgX;
                        isOrtho = true;
                    }

                    if (isOrtho) {
                        orthogonalLines.push(snappedSeg);
                    } else {
                        detailLines.push(seg);
                    }
                }
            });

            // 转换成扫描线 runs，对接已有的墙厚聚类算法
            const hRuns = [];
            const vRuns = [];
            orthogonalLines.forEach(l => {
                const isH = Math.abs(l.y1 - l.y2) < 2;
                if (isH) {
                    hRuns.push({ y: l.y1, x1: Math.min(l.x1, l.x2), x2: Math.max(l.x1, l.x2) });
                } else {
                    vRuns.push({ x: l.x1, y1: Math.min(l.y1, l.y2), y2: Math.max(l.y1, l.y2) });
                }
            });

            if (hRuns.length === 0 && vRuns.length === 0) {
                this.showToast('未在截图中识别出有效的建筑线条！', 'error'); return;
            }

            // ===== 第三阶段补充：墙厚聚类合并 =====
            hRuns.sort((a, b) => a.y - b.y);
            const hWalls = [];
            let grp = [];
            for (let i = 0; i < hRuns.length; i++) {
                if (grp.length === 0 || hRuns[i].y - grp[grp.length - 1].y <= WALL_THICK) {
                    grp.push(hRuns[i]);
                } else { this._clusterHRuns(grp, hWalls, MIN_RUN, mergeGap); grp = [hRuns[i]]; }
            }
            if (grp.length > 0) this._clusterHRuns(grp, hWalls, MIN_RUN, mergeGap);

            vRuns.sort((a, b) => a.x - b.x);
            const vWalls = [];
            grp = [];
            for (let i = 0; i < vRuns.length; i++) {
                if (grp.length === 0 || vRuns[i].x - grp[grp.length - 1].x <= WALL_THICK) {
                    grp.push(vRuns[i]);
                } else { this._clusterVRuns(grp, vWalls, MIN_RUN, mergeGap); grp = [vRuns[i]]; }
            }
            if (grp.length > 0) this._clusterVRuns(grp, vWalls, MIN_RUN, mergeGap);

            // ===== 第四阶段：端点吸附 =====
            this._snapWallEndpoints(hWalls, vWalls, snapVal);

            // ===== 第五阶段：墙体开口检测 → 门 / 窗 =====
            const openings = [];

            hWalls.forEach(wall => {
                if (wall.segs.length < 2) return;
                const sorted = [...wall.segs].sort((a, b) => a.x1 - b.x1);
                for (let i = 0; i < sorted.length - 1; i++) {
                    const gStart = sorted[i].x2, gEnd = sorted[i+1].x1, gW = gEnd - gStart;
                    if (gW >= Math.max(12, Math.round(MIN_RUN * 0.8)) && gW <= Math.round(WALL_THICK * 6.5)) {
                        const cx = (gStart + gEnd) / 2, cy = wall.y;
                        let crossFeat = 0;
                        const samplingOffset = Math.max(4, Math.round(WALL_THICK * 0.4));
                        const sy1 = Math.max(0, Math.round(cy) - samplingOffset), sy2 = Math.min(h - 1, Math.round(cy) + samplingOffset);
                        for (let sy = sy1; sy <= sy2; sy++) {
                            let fg = 0;
                            for (let sx = Math.round(gStart) + 2; sx < Math.round(gEnd) - 2; sx++) {
                                if (sx >= 0 && sx < w && cleanArr[sy * w + sx] === 1) fg++;
                            }
                            if (fg > gW * 0.4) crossFeat++;
                        }
                        openings.push({ type: crossFeat >= Math.max(3, Math.round(samplingOffset * 0.6)) ? 'window' : 'door', cx, cy, ow: gW, oh: WALL_THICK, isH: true });
                    }
                }
            });

            vWalls.forEach(wall => {
                if (wall.segs.length < 2) return;
                const sorted = [...wall.segs].sort((a, b) => a.y1 - b.y1);
                for (let i = 0; i < sorted.length - 1; i++) {
                    const gStart = sorted[i].y2, gEnd = sorted[i+1].y1, gH = gEnd - gStart;
                    if (gH >= Math.max(12, Math.round(MIN_RUN * 0.8)) && gH <= Math.round(WALL_THICK * 6.5)) {
                        const cx = wall.x, cy = (gStart + gEnd) / 2;
                        let crossFeat = 0;
                        const samplingOffset = Math.max(4, Math.round(WALL_THICK * 0.4));
                        const sx1 = Math.max(0, Math.round(cx) - samplingOffset), sx2 = Math.min(w - 1, Math.round(cx) + samplingOffset);
                        for (let sx = sx1; sx <= sx2; sx++) {
                            let fg = 0;
                            for (let sy = Math.round(gStart) + 2; sy < Math.round(gEnd) - 2; sy++) {
                                if (sy >= 0 && sy < h && cleanArr[sy * w + sx] === 1) fg++;
                            }
                            if (fg > gH * 0.4) crossFeat++;
                        }
                        openings.push({ type: crossFeat >= Math.max(3, Math.round(samplingOffset * 0.6)) ? 'window' : 'door', cx, cy, ow: WALL_THICK, oh: gH, isH: false });
                    }
                }
            });

            // ===== 第六阶段：封闭房间检测 (Flood Fill) =====
            const GS = 4; // 网格缩放因子
            const gw = Math.ceil(w / GS), gh = Math.ceil(h / GS);
            const roomGrid = new Uint8Array(gw * gh);

            const markLine = (px1, py1, px2, py2) => {
                let gx1 = Math.floor(px1/GS), gy1 = Math.floor(py1/GS);
                let gx2 = Math.floor(px2/GS), gy2 = Math.floor(py2/GS);
                let ddx = Math.abs(gx2 - gx1), ddy = Math.abs(gy2 - gy1);
                let ssx = gx1 < gx2 ? 1 : -1, ssy = gy1 < gy2 ? 1 : -1;
                let er = ddx - ddy, ccx = gx1, ccy = gy1;
                while (true) {
                    for (let t = -1; t <= 1; t++) {
                        const tx = ccx + (ddy > ddx ? t : 0), ty = ccy + (ddx >= ddy ? t : 0);
                        if (tx >= 0 && tx < gw && ty >= 0 && ty < gh) roomGrid[ty * gw + tx] = 1;
                    }
                    if (ccx === gx2 && ccy === gy2) break;
                    const e2 = 2 * er;
                    if (e2 > -ddy) { er -= ddy; ccx += ssx; }
                    if (e2 < ddx) { er += ddx; ccy += ssy; }
                }
            };

            hWalls.forEach(wl => wl.segs.forEach(s => markLine(s.x1, wl.y, s.x2, wl.y)));
            vWalls.forEach(wl => wl.segs.forEach(s => markLine(wl.x, s.y1, wl.x, s.y2)));

            const roomVis = new Uint8Array(gw * gh);
            const rooms = [];
            for (let gy = 1; gy < gh - 1; gy++) {
                for (let gx = 1; gx < gw - 1; gx++) {
                    const gi = gy * gw + gx;
                    if (roomGrid[gi] === 1 || roomVis[gi]) continue;
                    const queue = [gi]; roomVis[gi] = 1;
                    let area = 0, sX = 0, sY = 0, rMinX = gx, rMaxX = gx, rMinY = gy, rMaxY = gy;
                    let border = false;
                    while (queue.length > 0) {
                        const cur = queue.shift();
                        const cx2 = cur % gw, cy2 = Math.floor(cur / gw);
                        area++; sX += cx2; sY += cy2;
                        rMinX = Math.min(rMinX, cx2); rMaxX = Math.max(rMaxX, cx2);
                        rMinY = Math.min(rMinY, cy2); rMaxY = Math.max(rMaxY, cy2);
                        if (cx2 <= 0 || cx2 >= gw - 1 || cy2 <= 0 || cy2 >= gh - 1) border = true;
                        [cur-1, cur+1, cur-gw, cur+gw].forEach(n => {
                            if (n >= 0 && n < gw * gh && !roomVis[n] && roomGrid[n] === 0) { roomVis[n] = 1; queue.push(n); }
                        });
                    }
                    if (!border && area >= (gw * gh) * 0.005) {
                        rooms.push({ area, cx: (sX/area)*GS, cy: (sY/area)*GS,
                            minX: rMinX*GS, minY: rMinY*GS, maxX: rMaxX*GS, maxY: rMaxY*GS });
                    }
                }
            }
            rooms.sort((a, b) => b.area - a.area);

            // ===== 第七阶段：组装最终 CAD 图形 =====
            const finalWorldShapes = [];
            const wallProps = Object.assign({}, this.defaultProperties, { stroke: 'wall', strokeWidth: 10, strokeStyle: 'solid' });
            const blockProps = Object.assign({}, this.defaultProperties, { stroke: 'furniture', strokeWidth: 1.5, strokeStyle: 'solid' });
            const dimProps = { stroke: 'dimension', strokeWidth: 1.5 };

            let allMinX = Infinity, allMaxX = -Infinity, allMinY = Infinity, allMaxY = -Infinity;
            hWalls.forEach(wl => wl.segs.forEach(s => {
                allMinX = Math.min(allMinX, s.x1); allMaxX = Math.max(allMaxX, s.x2);
                allMinY = Math.min(allMinY, wl.y); allMaxY = Math.max(allMaxY, wl.y);
            }));
            vWalls.forEach(wl => wl.segs.forEach(s => {
                allMinX = Math.min(allMinX, wl.x); allMaxX = Math.max(allMaxX, wl.x);
                allMinY = Math.min(allMinY, s.y1); allMaxY = Math.max(allMaxY, s.y2);
            }));

            if (allMinX >= allMaxX || allMinY >= allMaxY) {
                this.showToast('未检测到有效的墙体结构！', 'error'); return;
            }

            const bW = allMaxX - allMinX, bH = allMaxY - allMinY;
            const cxB = (allMinX + allMaxX) / 2, cyB = (allMinY + allMaxY) / 2;
            if (isNewImage || !this.vectorizeCenter) {
                this.vectorizeCenter = this.screenToWorld(this.canvas.clientWidth / 2, this.canvas.clientHeight / 2);
                this.vectorizeImageCenter = { x: cxB, y: cyB };
            }
            const wCtr = this.vectorizeCenter;
            const useCxB = this.vectorizeImageCenter.x;
            const useCyB = this.vectorizeImageCenter.y;
            const toW = (px, py) => ({ x: wCtr.x + (px - useCxB), y: wCtr.y + (py - useCyB) });

            // 输出墙体
            let wallCount = 0;
            hWalls.forEach(wl => wl.segs.forEach(s => {
                const p1 = toW(s.x1, wl.y), p2 = toW(s.x2, wl.y);
                finalWorldShapes.push(new LineShape(p1.x, p1.y, p2.x, p2.y, this.activeLayer, wallProps));
                wallCount++;
            }));
            vWalls.forEach(wl => wl.segs.forEach(s => {
                const p1 = toW(wl.x, s.y1), p2 = toW(wl.x, s.y2);
                finalWorldShapes.push(new LineShape(p1.x, p1.y, p2.x, p2.y, this.activeLayer, wallProps));
                wallCount++;
            }));

            // 输出非正交细节线条（对角斜线、曲线简化多段线、家具轮廓等）
            detailLines.forEach(l => {
                const p1 = toW(l.x1, l.y1), p2 = toW(l.x2, l.y2);
                finalWorldShapes.push(new LineShape(p1.x, p1.y, p2.x, p2.y, this.activeLayer, blockProps));
            });

            // 输出门/窗
            let doorCount = 0, windowCount = 0;
            openings.forEach(op => {
                const center = toW(op.cx, op.cy);
                const size = op.isH ? op.ow : op.oh;
                const angle = op.isH ? 0 : Math.PI / 2;
                if (op.type === 'door') {
                    finalWorldShapes.push(new BlockShape('door', center.x, center.y, size, size, angle, this.activeLayer, blockProps));
                    doorCount++;
                } else {
                    const ww = op.isH ? op.ow : WALL_THICK, wh = op.isH ? WALL_THICK : op.oh;
                    finalWorldShapes.push(new BlockShape('window', center.x, center.y, ww, wh, angle, this.activeLayer, blockProps));
                    windowCount++;
                }
            });

            // 智能房间标注
            const usedLabels = new Set();
            rooms.forEach((room, idx) => {
                const center = toW(room.cx, room.cy);
                let label = '';
                const relArea = room.area / (rooms[0] ? rooms[0].area : 1);
                if (idx === 0 && rooms.length >= 3) label = '客厅';
                else if (relArea > 0.5 && !usedLabels.has('客厅')) label = '客厅';
                else if (relArea > 0.35) { label = !usedLabels.has('主卧室') ? '主卧室' : '卧室'; }
                else if (relArea > 0.15) {
                    if (!usedLabels.has('次卧')) label = '次卧';
                    else if (!usedLabels.has('书房')) label = '书房';
                    else if (!usedLabels.has('厨房')) label = '厨房';
                    else label = '房间';
                } else if (relArea > 0.05) {
                    if (!usedLabels.has('卫生间')) label = '卫生间';
                    else if (!usedLabels.has('次卫')) label = '次卫';
                    else if (!usedLabels.has('玄关')) label = '玄关';
                    else label = '储物间';
                } else label = '阳台';
                usedLabels.add(label);
                finalWorldShapes.push(new TextShape(center.x - label.length * 7, center.y, label, this.activeLayer, { stroke: 'text' }));
            });

            // 尺寸标注线
            const wMinX = wCtr.x + (allMinX - cxB), wMaxX = wCtr.x + (allMaxX - cxB);
            const wMinY = wCtr.y + (allMinY - cyB), wMaxY = wCtr.y + (allMaxY - cyB);
            finalWorldShapes.push(new DimShape(wMaxX, wMinY, wMinX, wMinY, 'Dimensions', dimProps));
            finalWorldShapes.push(new DimShape(wMinX, wMaxY, wMaxX, wMaxY, 'Dimensions', dimProps));
            finalWorldShapes.push(new DimShape(wMinX, wMinY, wMinX, wMaxY, 'Dimensions', dimProps));
            finalWorldShapes.push(new DimShape(wMaxX, wMaxY, wMaxX, wMinY, 'Dimensions', dimProps));

            // 指北针
            finalWorldShapes.push(new BlockShape('compass', wMaxX + 50, wMinY - 20, 45, 45, 0, this.activeLayer, blockProps));

            // 推入画布
            this.shapes = finalWorldShapes;

            if (isNewImage && bW > 10 && bH > 10) {
                const scaleX = (this.canvas.clientWidth * 0.72) / bW;
                const scaleY = (this.canvas.clientHeight * 0.72) / bH;
                this.zoom = Math.max(0.1, Math.min(4.0, Math.min(scaleX, scaleY)));
                this.panX = this.canvas.clientWidth / 2 - wCtr.x * this.zoom;
                this.panY = this.canvas.clientHeight / 2 - wCtr.y * this.zoom;
                document.getElementById('zoom-factor').innerText = Math.round(this.zoom * 100) + '%';
            }

            this.saveState();
            this.render();

            let msg = `🎉 智能图纸重构成功！识别墙体 ${wallCount} 段`;
            const found = [];
            if (doorCount > 0) found.push(`门x${doorCount}`);
            if (windowCount > 0) found.push(`窗x${windowCount}`);
            if (rooms.length > 0) found.push(`房间x${rooms.length}`);
            if (found.length > 0) msg += `，${found.join('、')}`;
            this.showToast(msg, 'success');
            document.getElementById('status-activity').innerText = `图纸重构成功：${wallCount}段墙体、${doorCount}扇门、${windowCount}扇窗、${rooms.length}个房间`;

            URL.revokeObjectURL(img.src);

        } catch (err) {
            console.error(err);
            this.showToast('图纸矢量化与重构过程中发生未知错误！', 'error');
        }
    }

    // --- 7h. Gemini Vision API 智能识别重构引擎 (V3.5) ---
    async vectorizeImageWithAI(blob, apiKey) {
        this.showToast('正在发送图纸给 Gemini AI 大模型分析...', 'loading');
        document.getElementById('status-activity').innerText = 'AI 大模型进行图纸空间结构分析中...';

        try {
            // 🌟 自动切换到白图纸主题，获得最佳对比度
            this.theme = 'light';
            document.body.classList.add('light-theme');

            const result = await this.callGeminiVision(blob, apiKey);
            if (!result || (!result.walls && !result.rooms)) {
                throw new Error('大模型未能识别出有效的墙体或房间结构。');
            }

            this.showToast('AI 分析完成，正在进行 CAD 矢量对齐与绘制...', 'loading');

            const finalWorldShapes = [];
            const wallProps = Object.assign({}, this.defaultProperties, { stroke: 'wall', strokeWidth: 10, strokeStyle: 'solid' });
            const blockProps = Object.assign({}, this.defaultProperties, { stroke: 'furniture', strokeWidth: 1.5, strokeStyle: 'solid' });
            const dimProps = { stroke: 'dimension', strokeWidth: 1.5 };

            // 1. 确定边界（Gemini 坐标映射是 0-800 X, 0-800 Y）
            let minX = 0, maxX = 800, minY = 0, maxY = 800;
            const bW = maxX - minX, bH = maxY - minY;
            const cxB = (minX + maxX) / 2, cyB = (minY + maxY) / 2;
            const wCtr = this.screenToWorld(this.canvas.clientWidth / 2, this.canvas.clientHeight / 2);
            
            // AI 坐标映射到 CAD 物理空间
            const toW = (px, py) => ({ 
                x: wCtr.x + (px - cxB), 
                y: wCtr.y + (py - cyB) 
            });

            // 2. 绘制墙线 (walls)
            let wallCount = 0;
            if (result.walls && Array.isArray(result.walls)) {
                result.walls.forEach(w => {
                    const p1 = toW(w.x1, w.y1), p2 = toW(w.x2, w.y2);
                    finalWorldShapes.push(new LineShape(p1.x, p1.y, p2.x, p2.y, this.activeLayer, wallProps));
                    wallCount++;
                });
            }

            // 3. 绘制门/窗 (doors / windows)
            let doorCount = 0, windowCount = 0;
            if (result.doors && Array.isArray(result.doors)) {
                result.doors.forEach(d => {
                    const center = toW(d.cx, d.cy);
                    finalWorldShapes.push(new BlockShape('door', center.x, center.y, d.w || 60, d.h || 60, d.angle || 0, this.activeLayer, blockProps));
                    doorCount++;
                });
            }
            if (result.windows && Array.isArray(result.windows)) {
                result.windows.forEach(w => {
                    const center = toW(w.cx, w.cy);
                    finalWorldShapes.push(new BlockShape('window', center.x, center.y, w.w || 80, w.h || 20, w.angle || 0, this.activeLayer, blockProps));
                    windowCount++;
                });
            }

            // 4. 绘制房间标注 (rooms)
            let roomCount = 0;
            const roomsList = [];
            if (result.rooms && Array.isArray(result.rooms)) {
                result.rooms.forEach(r => {
                    const center = toW(r.cx, r.cy);
                    finalWorldShapes.push(new TextShape(center.x - r.name.length * 7, center.y, r.name, this.activeLayer, { stroke: 'text' }));
                    roomsList.push(r.name);
                    roomCount++;
                });
            }

            // 5. 绘制边界尺寸标注
            finalWorldShapes.push(new DimShape(wCtr.x + 400, wCtr.y - 400, wCtr.x - 400, wCtr.y - 400, 'Dimensions', dimProps));
            finalWorldShapes.push(new DimShape(wCtr.x - 400, wCtr.y + 400, wCtr.x + 400, wCtr.y + 400, 'Dimensions', dimProps));
            finalWorldShapes.push(new DimShape(wCtr.x - 400, wCtr.y - 400, wCtr.x - 400, wCtr.y + 400, 'Dimensions', dimProps));
            finalWorldShapes.push(new DimShape(wCtr.x + 400, wCtr.y + 400, wCtr.x + 400, wCtr.y - 400, 'Dimensions', dimProps));

            // 6. 绘制指北针
            finalWorldShapes.push(new BlockShape('compass', wCtr.x + 450, wCtr.y - 420, 45, 45, 0, this.activeLayer, blockProps));

            // 推入并重绘
            this.shapes = finalWorldShapes;
            this.zoom = 0.65;
            this.panX = this.canvas.clientWidth / 2 - wCtr.x * this.zoom;
            this.panY = this.canvas.clientHeight / 2 - wCtr.y * this.zoom;
            document.getElementById('zoom-factor').innerText = Math.round(this.zoom * 100) + '%';

            this.saveState();
            this.render();

            let successMsg = `🎉 AI 智能重构成功！识别墙线 ${wallCount} 段`;
            const blocksFound = [];
            if (doorCount > 0) blocksFound.push(`门x${doorCount}`);
            if (windowCount > 0) blocksFound.push(`窗x${windowCount}`);
            if (roomCount > 0) blocksFound.push(`房间x${roomCount}`);
            if (blocksFound.length > 0) successMsg += `，已套用大模型检测到的结构：${blocksFound.join('、')}`;
            this.showToast(successMsg, 'success');
            document.getElementById('status-activity').innerText = `AI 图纸智能重构成功！已导入 ${wallCount} 墙线及标准门窗房间块`;

        } catch (err) {
            console.error(err);
            this.showToast(`AI 识别重构发生错误: ${err.message}`, 'error');
            document.getElementById('status-activity').innerText = 'AI 识别重构失败！';
        }
    }

    async callGeminiVision(blob, apiKey) {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(blob);
        await new Promise(resolve => fileReader.onloadend = resolve);
        const base64Data = fileReader.result.split(',')[1];
        const mimeType = blob.type;

        const prompt = `你是一个专业的建筑图纸数字化大师。请分析这张户型图纸截图，提取出其核心的建筑结构，并返回一个 JSON 对象。
坐标系范围为 X: 0 到 800, Y: 0 到 800（原点在左上角）。请把所有提取出的物体映射到这个坐标系中。

返回的 JSON 必须严格符合以下格式，不要包含任何 markdown 标记、\`\`\`json 标记或多余的文字：
{
  "walls": [
    {"x1": 100, "y1": 100, "x2": 400, "y2": 100}
  ],
  "doors": [
    {"cx": 120, "cy": 150, "w": 60, "h": 60, "angle": 0}
  ],
  "windows": [
    {"cx": 300, "cy": 100, "w": 80, "h": 20, "angle": 0}
  ],
  "rooms": [
    {"cx": 250, "cy": 250, "name": "客厅"}
  ]
}

注意：
1. walls 表示所有的墙线（即轴线），尽量合并成长直线段，忽略彩色填充细节。
2. doors 表示单开门，它的 w 和 h 是大小，angle 是弧度值。
3. windows 表示窗户，w 表示窗宽，h 表示窗厚，angle 是角弧度。
4. rooms 表示封闭房间的标注名称，请提供其中心坐标 cx, cy 以及名称。
5. 务必提取完整的所有墙线，确保空间相对位置合理。`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Google API returned status ${res.status}: ${errText}`);
        }

        const data = await res.json();
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            throw new Error("Gemini AI 未能生成任何回复。请检查您的 API Key 或网络状况。");
        }
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text.trim());
    }

    // --- Premium 1:1 Floor Plan Reconstruction Template Loader ---
    load1to1Template() {
        this.showToast('正在为您一比一还原高清晰度 1:1 户型矢量图纸...', 'loading');

        try {
            // 1. 自动切换到 Light Theme (白图纸)，完美对齐截图二
            this.theme = 'light';
            document.body.classList.add('light-theme');
            
            // 2. 清空画布
            this.shapes = [];
            this.selectedShape = null;
            this.vectorizeCenter = null;
            this.vectorizeImageCenter = null;

            // 属性定义
            const wallProps = { stroke: 'wall', strokeWidth: 10, strokeStyle: 'solid' };
            const thinWallProps = { stroke: 'wall', strokeWidth: 5, strokeStyle: 'solid' };
            const blockProps = { stroke: 'furniture', strokeWidth: 1.5, strokeStyle: 'solid' };

            const wCenter = { x: 0, y: 0 };
            const newShapes = [];

            // 🌟 3. 绘制 1:1 墙体框架线 (LineShape, 颜色语义化)
            // 外墙轮廓
            newShapes.push(new LineShape(-200, -320, 200, -320, 'Layer_0', wallProps)); // 顶部外墙
            newShapes.push(new LineShape(-200, -320, -200, -40, 'Layer_0', wallProps)); // 左上方外墙
            newShapes.push(new LineShape(200, -320, 200, 50, 'Layer_0', wallProps)); // 右上方外墙
            newShapes.push(new LineShape(240, 50, 240, 320, 'Layer_0', wallProps)); // 右下方外墙 (主卧/卫侧)
            newShapes.push(new LineShape(-140, -40, -140, 320, 'Layer_0', wallProps)); // 左下方外墙
            newShapes.push(new LineShape(-140, 320, 240, 320, 'Layer_0', wallProps)); // 最底部内墙

            // Foyer/玄关突出墙体
            newShapes.push(new LineShape(-200, -40, -140, -40, 'Layer_0', wallProps)); // 玄关横墙
            
            // 室内间隔墙 (Horizontal & Vertical Partition Walls)
            // 书房与卧室隔墙
            newShapes.push(new LineShape(20, -320, 20, -100, 'Layer_0', wallProps));
            // 顶房与客厅/厨房隔墙
            newShapes.push(new LineShape(-200, -100, -80, -100, 'Layer_0', wallProps)); // 书房横墙
            newShapes.push(new LineShape(80, -100, 200, -100, 'Layer_0', wallProps)); // 卧室横墙
            
            // 厨房与主卧/客厅的隔墙
            newShapes.push(new LineShape(80, -100, 80, 50, 'Layer_0', wallProps)); // 厨房左竖墙
            newShapes.push(new LineShape(80, 50, 200, 50, 'Layer_0', wallProps)); // 厨房下横墙
            
            // 卫生间隔墙
            newShapes.push(new LineShape(150, 50, 150, 150, 'Layer_0', wallProps)); // 卫左竖墙
            newShapes.push(new LineShape(150, 150, 240, 150, 'Layer_0', wallProps)); // 卫下横墙
            
            // 主卧隔墙
            newShapes.push(new LineShape(50, 150, 50, 320, 'Layer_0', wallProps)); // 主卧左竖墙
            
            // 阳台围挡及矮墙
            newShapes.push(new LineShape(-140, 320, -140, 370, 'Layer_0', thinWallProps)); // 阳台左墙
            newShapes.push(new LineShape(50, 320, 50, 370, 'Layer_0', thinWallProps)); // 阳台右墙
            newShapes.push(new LineShape(-140, 370, 50, 370, 'Layer_0', thinWallProps)); // 阳台前矮墙

            // 🌟 4. 绘制标准图块家具 (BlockShape, 颜色语义化)
            // A. Windows (窗户)
            newShapes.push(new BlockShape('window', -90, -320, 100, 12, 0, 'Layer_0', blockProps)); // 书房窗
            newShapes.push(new BlockShape('window', 110, -320, 100, 12, 0, 'Layer_0', blockProps)); // 卧室窗
            newShapes.push(new BlockShape('window', 200, -10, 12, 60, Math.PI/2, 'Layer_0', blockProps)); // 厨房窗
            
            // B. Doors (门)
            newShapes.push(new BlockShape('door', -200, -40, 55, 55, Math.PI/2, 'Layer_0', blockProps)); // 玄关大门
            newShapes.push(new BlockShape('door', -30, -100, 50, 50, -Math.PI/2, 'Layer_0', blockProps)); // 书房门
            newShapes.push(new BlockShape('door', 30, -100, 50, 50, 0, 'Layer_0', blockProps)); // 卧室门
            newShapes.push(new BlockShape('door', 50, 155, 45, 45, Math.PI/2, 'Layer_0', blockProps)); // 主卧门
            newShapes.push(new BlockShape('door', 150, 105, 45, 45, Math.PI/2, 'Layer_0', blockProps)); // 卫门
            newShapes.push(new BlockShape('sliding_door', -45, 320, 150, 12, 0, 'Layer_0', blockProps)); // 阳台推拉门

            // C. Beds (床)
            newShapes.push(new BlockShape('bed', 110, -210, 110, 125, 0, 'Layer_0', blockProps)); // 次卧双人床
            newShapes.push(new BlockShape('bed', 150, 240, 130, 135, Math.PI, 'Layer_0', blockProps)); // 主卧双人床

            // D. Sofa, Rug & Table (客厅沙发、地毯、茶几、落地灯)
            newShapes.push(new BlockShape('sofa', -110, 140, 45, 140, -Math.PI/2, 'Layer_0', blockProps)); // 三人沙发
            newShapes.push(new BlockShape('rug', -40, 140, 75, 125, 0, 'Layer_0', blockProps)); // 地毯
            newShapes.push(new BlockShape('coffee_table', -40, 140, 35, 75, 0, 'Layer_0', blockProps)); // 茶几
            newShapes.push(new BlockShape('floor_lamp', -115, 55, 15, 15, 0, 'Layer_0', blockProps)); // 落地灯

            // E. Dining Table (餐厅桌椅组合)
            newShapes.push(new BlockShape('dining_table', -20, 15, 70, 90, 0, 'Layer_0', blockProps));

            // F. Kitchen Stuffs (厨房灶台、水槽)
            newShapes.push(new BlockShape('stove', 155, 10, 40, 50, 0, 'Layer_0', blockProps)); // 灶台
            newShapes.push(new BlockShape('sink', 155, -70, 40, 60, 0, 'Layer_0', blockProps)); // 水槽

            // G. Bathroom Stuffs (卫浴马桶、洗手盆)
            newShapes.push(new BlockShape('toilet', 215, 80, 35, 50, Math.PI/2, 'Layer_0', blockProps)); // 马桶
            newShapes.push(new BlockShape('basin', 180, 125, 45, 40, Math.PI, 'Layer_0', blockProps)); // 卫内洗手台
            newShapes.push(new BlockShape('basin', 115, 80, 40, 40, 0, 'Layer_0', blockProps)); // 卫外过道洗手台

            // H. AC Units (空调机组)
            newShapes.push(new BlockShape('ac', -40, -345, 50, 20, 0, 'Layer_0', blockProps));
            newShapes.push(new BlockShape('ac', 40, -345, 50, 20, 0, 'Layer_0', blockProps));
            newShapes.push(new BlockShape('ac', 90, 395, 50, 20, 0, 'Layer_0', blockProps));

            // I. Compass (指北针 N)
            newShapes.push(new BlockShape('compass', 200, -260, 45, 45, 0, 'Layer_0', blockProps));

            // 🌟 5. 绘制填充物 (阳台淡蓝色玻璃地台)
            const balconyBg = { stroke: 'furniture', strokeWidth: 1.5, fill: 'rgba(51, 165, 255, 0.15)' };
            newShapes.push(new RectShape(50, 320, 100, 48, 'Layer_0', balconyBg));

            // 🌟 6. 绘制房名标注文字 (TextShape)
            newShapes.push(new TextShape(-120, -200, '书房', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(90, -200, '卧室', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(-165, -70, '玄关', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(-35, 15, '餐厅', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(-50, 145, '客厅', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(135, -20, '厨房', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(195, 120, '卫生间', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(130, 245, '主卧室', 'Layer_0', { stroke: 'text' }));
            newShapes.push(new TextShape(-85, 350, '休闲 / 景观阳台', 'Layer_0', { stroke: 'text' }));

            // 🌟 7. 绘制一比一尺寸测量标注线 (DimShape, 颜色语义化)
            const dimProps = { stroke: 'dimension', strokeWidth: 1.5 };
            newShapes.push(new DimShape(-200, -320, 200, -320, 'Dimensions', dimProps)); // 顶横墙尺寸
            newShapes.push(new DimShape(-200, -100, -200, -40, 'Dimensions', dimProps)); // 大门侧墙尺寸
            newShapes.push(new DimShape(200, -320, 200, -100, 'Dimensions', dimProps)); // 右上墙体尺寸
            newShapes.push(new DimShape(240, 150, 240, 320, 'Dimensions', dimProps)); // 主卧右墙尺寸
            newShapes.push(new DimShape(-140, 320, 50, 320, 'Dimensions', dimProps)); // 下横墙尺寸

            // 8. 正式推入画布
            this.shapes = newShapes;

            // 9. 视口最佳缩放与居中对齐，留出 25% 边距
            const scaleX = (this.canvas.clientWidth * 0.72) / 600;
            const scaleY = (this.canvas.clientHeight * 0.72) / 850;
            this.zoom = Math.max(0.2, Math.min(3.0, Math.min(scaleX, scaleY)));
            this.panX = this.canvas.clientWidth / 2 - wCenter.x * this.zoom;
            this.panY = this.canvas.clientHeight / 2 - wCenter.y * this.zoom;
            document.getElementById('zoom-factor').innerText = Math.round(this.zoom * 100) + '%';

            // 10. 保存历史状态并重新渲染
            this.saveState();
            this.render();

            this.showToast('🎉 一比一完美还原图纸截图！所有墙体、家具图块及标注均可二次编辑。', 'success');
            document.getElementById('status-activity').innerText = '1:1 图纸样例载入成功，已完美规整所有细节';

        } catch (err) {
            console.error(err);
            this.showToast('重现图纸样例发生错误！', 'error');
        }
    }

    // --- 7h. 极具科技感的毛玻璃 Toast 弹出通知 ---
    showToast(message, type = 'info') {
        let toast = document.getElementById('cad-toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cad-toast-notification';
            // 样式采用磨砂玻璃拟态搭配发光线条
            toast.style.cssText = `
                position: absolute;
                bottom: 64px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(11, 12, 16, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(0, 242, 254, 0.25);
                box-shadow: 0 8px 32px 0 rgba(0, 242, 254, 0.15);
                color: #f0f3f8;
                padding: 10px 24px;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 500;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                pointer-events: none;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.25);
            `;
            document.body.appendChild(toast);
        }

        // 根据通知类型配置动态图标及边框色
        let iconSvg = '';
        if (type === 'loading') {
            toast.style.borderColor = 'rgba(0, 242, 254, 0.3)';
            toast.style.boxShadow = '0 8px 32px 0 rgba(0, 242, 254, 0.15)';
            // 科技感旋转加载圈
            iconSvg = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00f2fe" stroke-width="3" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="rgba(0, 242, 254, 0.1)"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-dasharray="16" stroke-dashoffset="0"></path>
                </svg>
            `;
            // 添加旋转 CSS 动画定义，注入一次即可
            if (!document.getElementById('cad-spin-style')) {
                const s = document.createElement('style');
                s.id = 'cad-spin-style';
                s.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                document.head.appendChild(s);
            }
        } else if (type === 'success') {
            toast.style.borderColor = 'rgba(57, 255, 20, 0.3)';
            toast.style.boxShadow = '0 8px 32px 0 rgba(57, 255, 20, 0.15)';
            // 荧光绿对勾图标
            iconSvg = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#39ff14" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
        } else if (type === 'error') {
            toast.style.borderColor = 'rgba(255, 91, 91, 0.3)';
            toast.style.boxShadow = '0 8px 32px 0 rgba(255, 91, 91, 0.15)';
            // 警示叹号图标
            iconSvg = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff5b5b" stroke-width="3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `;
        }

        toast.innerHTML = `${iconSvg} <span>${message}</span>`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        // 如果不是 loading，则在 4 秒后自动渐渐隐藏
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        if (type !== 'loading') {
            this.toastTimeout = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
            }, 4000);
        }
    }
}

// --- 8. UI 控制与交互绑定 ---
let engine;

document.addEventListener('DOMContentLoaded', () => {
    engine = new CADEngine('cad-canvas');

    // 绑定绘制工具按钮
    const tools = ['select', 'line', 'rect', 'circle', 'curve', 'text', 'dim'];
    tools.forEach(tool => {
        const btn = document.getElementById(`tool-${tool}`);
        if (btn) {
            btn.addEventListener('click', () => {
                // 切换激活按钮状态
                tools.forEach(t => document.getElementById(`tool-${t}`).classList.remove('active'));
                btn.classList.add('active');
                
                engine.activeTool = tool;
                engine.drawingStartPoint = null;

                // 文字面板的特殊可见性切换
                document.getElementById('prop-text-row').style.display = tool === 'text' ? 'flex' : 'none';
                
                document.getElementById('status-activity').innerText = `已激活【${btn.getAttribute('data-tooltip').split(' (')[0]}】`;
                engine.render();
            });
        }
    });

    // 键盘快捷键绑定工具
    window.addEventListener('keydown', e => {
        if (document.activeElement.tagName === 'INPUT') return;
        const key = e.key.toLowerCase();
        if (key === 'v') document.getElementById('tool-select').click();
        else if (key === 'l') document.getElementById('tool-line').click();
        else if (key === 'r') document.getElementById('tool-rect').click();
        else if (key === 'c') document.getElementById('tool-circle').click();
        else if (key === 'q') document.getElementById('tool-curve').click();
        else if (key === 't') document.getElementById('tool-text').click();
        else if (key === 'd') document.getElementById('tool-dim').click();
        else if (key === 's') document.getElementById('btn-toggle-snap').click();
    });

    // 开关吸附按钮
    const snapBtn = document.getElementById('btn-toggle-snap');
    snapBtn.addEventListener('click', () => {
        engine.snapToGrid = !engine.snapToGrid;
        snapBtn.classList.toggle('active', engine.snapToGrid);
        document.getElementById('snap-status').innerText = engine.snapToGrid ? '开启' : '关闭';
        engine.render();
    });

    // 清空重置按钮（唤出二次确认弹窗）
    const clearModal = document.getElementById('modal-clear-confirm');
    document.getElementById('btn-new').addEventListener('click', () => {
        clearModal.classList.add('show');
    });

    document.getElementById('btn-clear-cancel').addEventListener('click', () => {
        clearModal.classList.remove('show');
    });

    clearModal.querySelector('.btn-close').addEventListener('click', () => {
        clearModal.classList.remove('show');
    });

    document.getElementById('btn-clear-confirm').addEventListener('click', () => {
        engine.shapes = [];
        engine.selectedShape = null;
        engine.vectorizeCenter = null;
        engine.vectorizeImageCenter = null;
        engine.drawingStartPoint = null;
        engine.panX = engine.canvas.clientWidth / 2;
        engine.panY = engine.canvas.clientHeight / 2;
        engine.zoom = 1.0;
        engine.saveState();
        resetInspectorToDefault();
        clearModal.classList.remove('show');
        engine.render();
        document.getElementById('status-activity').innerText = '画布已完全重置';
    });

    // 撤销 / 重做按钮
    document.getElementById('btn-undo').addEventListener('click', () => engine.undo());
    document.getElementById('btn-redo').addEventListener('click', () => engine.redo());

    // --- 属性栏修改绑定 ---
    const strokeInput = document.getElementById('prop-stroke');
    const strokeWidthInput = document.getElementById('prop-stroke-width');
    const strokeStyleInput = document.getElementById('prop-stroke-style');
    const fillToggle = document.getElementById('prop-fill-toggle');
    const fillInput = document.getElementById('prop-fill');
    const fillRow = document.getElementById('prop-fill-color-row');
    const textValInput = document.getElementById('prop-text-value');

    // 填充切换
    fillToggle.addEventListener('change', () => {
        fillRow.style.display = fillToggle.checked ? 'flex' : 'none';
        applyInspectorChanges();
    });

    // 各种输入元素在修改时，实时同步给选中的图形
    strokeInput.addEventListener('input', applyInspectorChanges);
    strokeWidthInput.addEventListener('change', applyInspectorChanges);
    strokeStyleInput.addEventListener('change', applyInspectorChanges);
    fillInput.addEventListener('input', applyInspectorChanges);
    textValInput.addEventListener('input', applyInspectorChanges);

    function applyInspectorChanges() {
        const changes = {
            stroke: strokeInput.value,
            strokeWidth: parseInt(strokeWidthInput.value),
            strokeStyle: strokeStyleInput.value,
            fill: fillToggle.checked ? fillInput.value : null,
            textValue: textValInput.value
        };

        // 更新默认配置，给后续新画图形使用
        engine.defaultProperties = Object.assign({}, engine.defaultProperties, changes);

        // 如果当前有选中的图形，则修改它的属性
        if (engine.selectedShape) {
            const s = engine.selectedShape;
            s.stroke = changes.stroke;
            s.strokeWidth = changes.strokeWidth;
            s.strokeStyle = changes.strokeStyle;
            s.fill = changes.fill;
            if (s.type === 'text') {
                s.text = changes.textValue;
            }
            engine.saveState();
            engine.render();
        }
    }

    // --- 图层控制管理 ---
    const layerContainer = document.getElementById('layer-container');
    const inputNewLayer = document.getElementById('input-new-layer');

    window.updateLayersUI = function() {
        layerContainer.innerHTML = '';
        Object.keys(engine.layers).forEach(layerId => {
            const layer = engine.layers[layerId];
            
            const item = document.createElement('div');
            item.className = `layer-item ${engine.activeLayer === layerId ? 'active' : ''}`;
            
            // 组装 HTML
            item.innerHTML = `
                <div class="layer-left">
                    <span class="layer-color-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${layer.color || '#fff'};"></span>
                    <span class="layer-name">${layer.name}</span>
                </div>
                <div class="layer-controls">
                    <button class="btn-layer-toggle btn-visible ${layer.visible ? 'active' : ''}" data-action="visible" data-tooltip="${layer.visible ? '点击隐藏图层' : '点击显示图层'}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            ${layer.visible ? 
                                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : 
                                '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                            }
                        </svg>
                    </button>
                    <button class="btn-layer-toggle btn-lock ${layer.locked ? 'active' : ''}" data-action="lock" data-tooltip="${layer.locked ? '点击解锁图层' : '点击锁定图层'}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            ${layer.locked ?
                                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' :
                                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'
                            }
                        </svg>
                    </button>
                </div>
            `;

            // 点击切换活动图层
            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-layer-toggle')) return; // 避开眼睛和锁的控制按钮
                engine.activeLayer = layerId;
                updateLayersUI();
                document.getElementById('status-activity').innerText = `已切换当前绘图图层为【${layer.name}】`;
            });

            // 眼睛和锁的控制逻辑
            item.querySelector('.btn-visible').addEventListener('click', () => {
                layer.visible = !layer.visible;
                engine.render();
                updateLayersUI();
            });

            item.querySelector('.btn-lock').addEventListener('click', () => {
                layer.locked = !layer.locked;
                if (layer.locked && engine.selectedShape && engine.selectedShape.layer === layerId) {
                    engine.selectedShape = null;
                }
                engine.render();
                updateLayersUI();
            });

            layerContainer.appendChild(item);
        });
    };

    // 新增自定义图层
    document.getElementById('btn-add-layer').addEventListener('click', () => {
        const name = inputNewLayer.value.trim();
        if (!name) return;

        const layerId = 'Layer_' + Math.random().toString(36).substr(2, 5);
        // 随机产生漂亮的霓虹图层颜色
        const colors = ['#39ff14', '#ff007f', '#ffff00', '#ff00ff', '#8a2be2', '#ff4500'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        engine.layers[layerId] = {
            name: name,
            visible: true,
            locked: false,
            color: randomColor
        };

        inputNewLayer.value = '';
        engine.activeLayer = layerId; // 自动设为当前
        updateLayersUI();
        engine.render();
    });

    updateLayersUI();

    // 绑定主题切换按钮
    document.getElementById('btn-toggle-theme').addEventListener('click', () => {
        engine.theme = engine.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('light-theme', engine.theme === 'light');
        document.getElementById('status-activity').innerText = `已切换当前主题为【${engine.theme === 'light' ? '白图纸 (Blueprint Paper)' : '蓝图纸 (CAD Neon)'}】`;
        engine.render();
    });

    // 绑定一键还原户型模版按钮
    document.getElementById('btn-load-template').addEventListener('click', () => {
        engine.load1to1Template();
    });

    // --- JSON 项目工程导入与导出 ---
    const fileLoader = document.getElementById('file-loader');
    
    document.getElementById('btn-open').addEventListener('click', () => fileLoader.click());

    fileLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                engine.restoreState(evt.target.result);
                engine.saveState();
                engine.render();
                document.getElementById('status-activity').innerText = '工程文件载入成功！';
            } catch(err) {
                alert('工程文件解析失败！请检查文件格式。');
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        const dataStr = JSON.stringify({
            shapes: engine.shapes,
            layers: engine.layers,
            activeLayer: engine.activeLayer
        }, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuantumCAD_Drawing_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // --- 导出高清图片 PNG ---
    document.getElementById('btn-export-png').addEventListener('click', () => {
        // 创建一个高比例的临时 Canvas 保证高清度
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = engine.canvas.width;
        exportCanvas.height = engine.canvas.height;

        // 1. 绘制背景色 (自适应当前主题)
        exportCtx.fillStyle = engine.theme === 'light' ? '#ffffff' : '#0d0e15';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // 2. 将引擎里所有图形渲染到导出 Canvas 上
        exportCtx.save();
        const dpr = window.devicePixelRatio || 1;
        exportCtx.scale(dpr, dpr);
        // 处理视口平移和缩放比例
        exportCtx.translate(engine.panX, engine.panY);
        exportCtx.scale(engine.zoom, engine.zoom);

        engine.shapes.forEach(s => {
            const layer = engine.layers[s.layer];
            if (layer && layer.visible) {
                exportCtx.save();
                exportCtx.strokeStyle = engine.resolveColor(s.stroke);
                exportCtx.lineWidth = s.strokeWidth;
                
                if (s.strokeStyle === 'dashed') exportCtx.setLineDash([8, 6]);
                else if (s.strokeStyle === 'dotted') exportCtx.setLineDash([2, 4]);

                if (s.type === 'block') {
                    exportCtx.save();
                    exportCtx.translate(s.cx, s.cy);
                    exportCtx.rotate(s.angle);
                    renderBlockSymbol(exportCtx, s.blockType, s.w, s.h, s.strokeWidth, engine.resolveColor(s.stroke));
                    exportCtx.restore();
                } else if (s.type === 'curve') {
                    if (s.points.length >= 2) {
                        exportCtx.beginPath();
                        exportCtx.moveTo(s.points[0].x, s.points[0].y);
                        for (let i = 1; i < s.points.length - 1; i++) {
                            const xc = (s.points[i].x + s.points[i+1].x) / 2;
                            const yc = (s.points[i].y + s.points[i+1].y) / 2;
                            exportCtx.quadraticCurveTo(s.points[i].x, s.points[i].y, xc, yc);
                        }
                        exportCtx.lineTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y);
                        exportCtx.stroke();
                    }
                } else if (s.type === 'line') {
                    exportCtx.beginPath();
                    exportCtx.moveTo(s.x1, s.y1);
                    exportCtx.lineTo(s.x2, s.y2);
                    exportCtx.stroke();
                } else if (s.type === 'rect') {
                    exportCtx.beginPath();
                    exportCtx.rect(s.x, s.y, s.w, s.h);
                    exportCtx.stroke();
                    if (s.fill) {
                        exportCtx.fillStyle = engine.resolveColor(s.fill);
                        exportCtx.fill();
                    }
                } else if (s.type === 'circle') {
                    exportCtx.beginPath();
                    exportCtx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
                    exportCtx.stroke();
                    if (s.fill) {
                        exportCtx.fillStyle = engine.resolveColor(s.fill);
                        exportCtx.fill();
                    }
                } else if (s.type === 'text') {
                    exportCtx.fillStyle = engine.resolveColor(s.stroke);
                    exportCtx.font = "bold 14px 'Inter', sans-serif";
                    exportCtx.textBaseline = 'bottom';
                    exportCtx.fillText(s.text, s.x, s.y);
                } else if (s.type === 'dim') {
                    engine.drawDimensionLine.call({ ctx: exportCtx }, s.x1, s.y1, s.x2, s.y2, engine.resolveColor(s.stroke));
                }
                exportCtx.restore();
            }
        });
        exportCtx.restore();

        // 3. 执行导出下载
        const url = exportCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuantumCAD_Render_${Date.now()}.png`;
        a.click();
    });

    // --- 核心突破：直接编译 SVG 矢量代码并导出 ---
    document.getElementById('btn-export-svg').addEventListener('click', () => {
        // 计算几何的包围盒，自适应设定 SVG 的 viewBox
        if (engine.shapes.length === 0) {
            alert('画布空空如也，无法导出！');
            return;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        engine.shapes.forEach(s => {
            if (s.type === 'line' || s.type === 'dim') {
                minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
                minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
            } else if (s.type === 'rect') {
                minX = Math.min(minX, s.x, s.x + s.w); maxX = Math.max(maxX, s.x, s.x + s.w);
                minY = Math.min(minY, s.y, s.y + s.h); maxY = Math.max(maxY, s.y, s.y + s.h);
            } else if (s.type === 'circle') {
                minX = Math.min(minX, s.cx - s.r); maxX = Math.max(maxX, s.cx + s.r);
                minY = Math.min(minY, s.cy - s.r); maxY = Math.max(maxY, s.cy + s.r);
            } else if (s.type === 'text') {
                minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x + 120);
                minY = Math.min(minY, s.y - 20); maxY = Math.max(maxY, s.y);
            } else if (s.type === 'block') {
                minX = Math.min(minX, s.cx - s.w/2); maxX = Math.max(maxX, s.cx + s.w/2);
                minY = Math.min(minY, s.cy - s.h/2); maxY = Math.max(maxY, s.cy + s.h/2);
            }
        });

        // 留出 40px 的外边距
        const pad = 40;
        const width = (maxX - minX) + pad * 2;
        const height = (maxY - minY) + pad * 2;
        const vbX = minX - pad;
        const vbY = minY - pad;

        // 编译 XML 数据
        let svgStr = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
        svgStr += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${width} ${height}" width="${width}" height="${height}">\n`;
        
        // 背景框 (自适应当前主题)
        const bgFill = engine.theme === 'light' ? '#ffffff' : '#0d0e15';
        svgStr += `  <rect x="${vbX}" y="${vbY}" width="${width}" height="${height}" fill="${bgFill}" />\n`;

        // 按照图层顺序编译元素
        engine.shapes.forEach(s => {
            const layer = engine.layers[s.layer];
            if (!layer || !layer.visible) return;

            let strokeDash = '';
            if (s.strokeStyle === 'dashed') strokeDash = ' stroke-dasharray="8,6"';
            else if (s.strokeStyle === 'dotted') strokeDash = ' stroke-dasharray="2,4"';

            const fillResolved = s.fill ? engine.resolveColor(s.fill) : 'none';
            const strokeResolved = engine.resolveColor(s.stroke);

            if (s.type === 'block') {
                // 块级 SVG 元素编译
                const w = s.w;
                const h = s.h;
                const deg = s.angle * 180 / Math.PI;
                svgStr += `  <g stroke="${strokeResolved}" stroke-width="${s.strokeWidth}" fill="none" transform="translate(${s.cx}, ${s.cy}) rotate(${deg})">\n`;
                svgStr += getBlockSVG(s.blockType, w, h, s.strokeWidth, strokeResolved);
                svgStr += `  </g>\n`;
            } else if (s.type === 'curve') {
                if (s.points.length >= 2) {
                    let d = `M ${s.points[0].x} ${s.points[0].y}`;
                    for (let i = 1; i < s.points.length - 1; i++) {
                        const xc = (s.points[i].x + s.points[i+1].x) / 2;
                        const yc = (s.points[i].y + s.points[i+1].y) / 2;
                        d += ` Q ${s.points[i].x} ${s.points[i].y}, ${xc} ${yc}`;
                    }
                    d += ` L ${s.points[s.points.length-1].x} ${s.points[s.points.length-1].y}`;
                    svgStr += `  <path d="${d}" stroke="${strokeResolved}" stroke-width="${s.strokeWidth}" fill="none"${strokeDash} />\n`;
                }
            } else if (s.type === 'line') {
                svgStr += `  <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${strokeResolved}" stroke-width="${s.strokeWidth}"${strokeDash} />\n`;
            } else if (s.type === 'rect') {
                svgStr += `  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" stroke="${strokeResolved}" stroke-width="${s.strokeWidth}" fill="${fillResolved}"${strokeDash} />\n`;
            } else if (s.type === 'circle') {
                svgStr += `  <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" stroke="${strokeResolved}" stroke-width="${s.strokeWidth}" fill="${fillResolved}"${strokeDash} />\n`;
            } else if (s.type === 'text') {
                svgStr += `  <text x="${s.x}" y="${s.y}" fill="${strokeResolved}" font-family="'Inter', sans-serif" font-weight="bold" font-size="14">${s.text}</text>\n`;
            } else if (s.type === 'dim') {
                // 尺寸标注编译为 SVG 引线 + 端点箭头 + 测量文字
                const dx = s.x2 - s.x1;
                const dy = s.y2 - s.y1;
                const len = Math.sqrt(dx*dx + dy*dy);
                const ux = dx / len;
                const uy = dy / len;
                const nx = -uy;
                const ny = ux;
                const offset = 25;

                const ax1 = s.x1 + nx * offset;
                const ay1 = s.y1 + ny * offset;
                const ax2 = s.x2 + nx * offset;
                const ay2 = s.y2 + ny * offset;

                // 引线 (虚线)
                svgStr += `  <g stroke="${strokeResolved}" stroke-width="1.5">\n`;
                svgStr += `    <line x1="${s.x1}" y1="${s.y1}" x2="${ax1}" y2="${ay1}" stroke-dasharray="4,4" />\n`;
                svgStr += `    <line x1="${s.x2}" y1="${s.y2}" x2="${ax2}" y2="${ay2}" stroke-dasharray="4,4" />\n`;
                // 标注线 (实线)
                svgStr += `    <line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" />\n`;
                
                // 箭头 1 (指向起点)
                const arrowLength = 8;
                const arrowWidth = 3.5;
                const a11x = ax1 + (ux * arrowLength) + (nx * arrowWidth);
                const a11y = ay1 + (uy * arrowLength) + (ny * arrowWidth);
                const a12x = ax1 + (ux * arrowLength) - (nx * arrowWidth);
                const a12y = ay1 + (uy * arrowLength) - (ny * arrowWidth);
                svgStr += `    <polygon points="${ax1},${ay1} ${a11x},${a11y} ${a12x},${a12y}" fill="${strokeResolved}" />\n`;

                // 箭头 2 (指向终点)
                const a21x = ax2 - (ux * arrowLength) + (nx * arrowWidth);
                const a21y = ay2 - (uy * arrowLength) + (ny * arrowWidth);
                const a22x = ax2 - (ux * arrowLength) - (nx * arrowWidth);
                const a22y = ay2 - (uy * arrowLength) - (ny * arrowWidth);
                svgStr += `    <polygon points="${ax2},${ay2} ${a21x},${a21y} ${a22x},${a22y}" fill="${strokeResolved}" />\n`;
                svgStr += `  </g>\n`;

                // 文字
                const mx = (ax1 + ax2) / 2;
                const my = (ay1 + ay2) / 2;
                let textAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                if (textAngle > 90 || textAngle < -90) textAngle += 180;
                svgStr += `  <text x="${mx}" y="${my - 3}" fill="${strokeResolved}" font-family="'Inter', sans-serif" font-size="11" text-anchor="middle" transform="rotate(${textAngle} ${mx} ${my})">${len.toFixed(1)} mm</text>\n`;
            }
        });

        svgStr += `</svg>\n`;

        // 下载 SVG 文件
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuantumCAD_Drawing_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // --- 智能微调滑块与按钮事件绑定 ---
    const sensInput = document.getElementById('tune-sens');
    const sensVal = document.getElementById('val-sens');
    if (sensInput) {
        sensInput.addEventListener('input', () => {
            const val = sensInput.value;
            if (sensVal) sensVal.innerText = val === '0' ? '自动' : val;
            if (engine.lastPastedBlob) {
                engine.vectorizeImage(engine.lastPastedBlob);
            }
        });
    }

    const wallThickInput = document.getElementById('tune-wall-thick');
    const wallThickVal = document.getElementById('val-wall-thick');
    if (wallThickInput) {
        wallThickInput.addEventListener('input', () => {
            if (wallThickVal) wallThickVal.innerText = wallThickInput.value + 'px';
            if (engine.lastPastedBlob) {
                engine.vectorizeImage(engine.lastPastedBlob);
            }
        });
    }

    const minRunInput = document.getElementById('tune-min-run');
    const minRunVal = document.getElementById('val-min-run');
    if (minRunInput) {
        minRunInput.addEventListener('input', () => {
            if (minRunVal) minRunVal.innerText = minRunInput.value + 'px';
            if (engine.lastPastedBlob) {
                engine.vectorizeImage(engine.lastPastedBlob);
            }
        });
    }

    const snapInput = document.getElementById('tune-snap');
    const snapVal = document.getElementById('val-snap');
    if (snapInput) {
        snapInput.addEventListener('input', () => {
            if (snapVal) snapVal.innerText = snapInput.value + 'px';
            if (engine.lastPastedBlob) {
                engine.vectorizeImage(engine.lastPastedBlob);
            }
        });
    }

    const btnReVectorize = document.getElementById('btn-re-vectorize');
    if (btnReVectorize) {
        btnReVectorize.addEventListener('click', () => {
            if (engine.lastPastedBlob) {
                engine.vectorizeImage(engine.lastPastedBlob);
            } else {
                engine.showToast('请先使用 Ctrl+V 粘贴一张户型图！', 'error');
            }
        });
    }

    // Gemini AI Panel Event Listeners (V3.5)
    const aiKeyInput = document.getElementById('ai-key');
    if (aiKeyInput) {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            aiKeyInput.value = savedKey;
        }
        aiKeyInput.addEventListener('change', () => {
            localStorage.setItem('gemini_api_key', aiKeyInput.value.trim());
        });
    }

    const btnAiReconstruct = document.getElementById('btn-ai-reconstruct');
    if (btnAiReconstruct) {
        btnAiReconstruct.addEventListener('click', () => {
            const apiKey = aiKeyInput ? aiKeyInput.value.trim() : '';
            if (!apiKey) {
                engine.showToast('请输入您的 Gemini API Key！', 'error');
                return;
            }
            if (engine.lastPastedBlob) {
                engine.vectorizeImageWithAI(engine.lastPastedBlob, apiKey);
            } else {
                engine.showToast('请先使用 Ctrl+V 粘贴一张户型图！', 'error');
            }
        });
    }

    // 启动时不自动加载模板，让用户自行选择粘贴图片或点击按钮加载样图
});

// --- 9. 辅助工具函数（与 Inspector UI 同步） ---
function syncInspector(s) {
    document.getElementById('prop-stroke').value = s.stroke;
    document.getElementById('prop-stroke-width').value = s.strokeWidth;
    document.getElementById('prop-stroke-style').value = s.strokeStyle;
    
    const fillToggle = document.getElementById('prop-fill-toggle');
    const fillRow = document.getElementById('prop-fill-color-row');
    const fillInput = document.getElementById('prop-fill');

    if (s.type === 'rect' || s.type === 'circle') {
        fillToggle.disabled = false;
        fillToggle.checked = !!s.fill;
        fillRow.style.display = s.fill ? 'flex' : 'none';
        if (s.fill) fillInput.value = s.fill;
    } else {
        fillToggle.disabled = true;
        fillToggle.checked = false;
        fillRow.style.display = 'none';
    }

    // 文字内容行
    const textRow = document.getElementById('prop-text-row');
    const textValInput = document.getElementById('prop-text-value');
    if (s.type === 'text') {
        textRow.style.display = 'flex';
        textValInput.value = s.text;
    } else {
        textRow.style.display = 'none';
    }
}

function resetInspectorToDefault() {
    document.getElementById('prop-stroke').value = engine.defaultProperties.stroke;
    document.getElementById('prop-stroke-width').value = engine.defaultProperties.strokeWidth;
    document.getElementById('prop-stroke-style').value = engine.defaultProperties.strokeStyle;
    
    const fillToggle = document.getElementById('prop-fill-toggle');
    fillToggle.disabled = false;
    fillToggle.checked = !!engine.defaultProperties.fill;
    document.getElementById('prop-fill-color-row').style.display = engine.defaultProperties.fill ? 'flex' : 'none';
    
    document.getElementById('prop-text-row').style.display = engine.activeTool === 'text' ? 'flex' : 'none';
}
