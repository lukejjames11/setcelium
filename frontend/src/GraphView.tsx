import { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3-force';
import type { GraphResponse, GraphNode } from './types';

const NODE_RADIUS = 28;
const imageCache = new Map<string, HTMLImageElement>();

function getImage(url: string): HTMLImageElement | null {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  const img = new Image();
  img.src = url;
  imageCache.set(url, img);
  return img;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    if (ctx.measureText(testLine).width < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

interface GraphViewProps {
  refreshTrigger: number;
}

function GraphView({ refreshTrigger }: GraphViewProps) {
  const [graphData, setGraphData] = useState<GraphResponse>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/graph')
      .then((response) => response.json())
      .then((data: GraphResponse) => setGraphData(data));
  }, [refreshTrigger]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('collide', forceCollide(NODE_RADIUS + 4));
    }
  }, [graphData]);

  return (
    <div>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        onNodeClick={(node) => setSelectedNode(node as GraphNode)}
        width={800}
        height={600}
        linkColor={() => 'rgba(255,255,255,0.6)'}
        linkWidth={2}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;

          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
          ctx.clip();

          if (node.imageUrl) {
            const img = getImage(node.imageUrl);
            if (img && img.complete) {
              ctx.drawImage(
                img,
                node.x - NODE_RADIUS,
                node.y - NODE_RADIUS,
                NODE_RADIUS * 2,
                NODE_RADIUS * 2
              );
            } else {
              ctx.fillStyle = '#3b82f6';
              ctx.fill();
            }
          } else {
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
          }
          ctx.restore();

          const maxTextWidth = NODE_RADIUS * 1.6;
          const lines = wrapText(ctx, node.name, maxTextWidth);
          const lineHeight = fontSize * 1.2;
          const startY = node.y + NODE_RADIUS + 6;

          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'white';
          lines.forEach((line, i) => {
            ctx.fillText(line, node.x, startY + i * lineHeight);
          });
        }}
      />
      {selectedNode && (
        <div>
          <h3>{selectedNode.name}</h3>
        </div>
      )}
    </div>
  );
}

export default GraphView;