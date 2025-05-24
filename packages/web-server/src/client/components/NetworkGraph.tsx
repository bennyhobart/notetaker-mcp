import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { VisualizationData } from '../types';

interface NetworkGraphProps {
  visualizationData: VisualizationData | null;
  selectedTags: Set<string>;
  onToggleTag: (tagName: string) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  visualizationData,
  selectedTags,
  onToggleTag
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!visualizationData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (visualizationData.connections.length === 0) {
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#666')
        .text('No tag connections found');
      return;
    }

    const width = 400;
    const height = 400;

    svg.attr('width', width).attr('height', height);

    const nodes = visualizationData.tags.map(tag => ({
      id: tag.name,
      count: tag.count,
      radius: 5 + (tag.count / Math.max(...visualizationData.tags.map(t => t.count))) * 15
    }));

    const links = visualizationData.connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      weight: conn.weight
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight));

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => selectedTags.has(d.id) ? '#f5576c' : '#667eea')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d: any) => onToggleTag(d.id));

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text((d: any) => d.id)
      .attr('font-size', 11)
      .attr('dx', 15)
      .attr('dy', 4);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [visualizationData, selectedTags, onToggleTag]);

  if (!visualizationData) {
    return (
      <div className="min-h-96 flex items-center justify-center text-gray-500">
        Loading network...
      </div>
    );
  }

  return (
    <div className="min-h-96">
      <svg ref={svgRef} className="w-full h-96" />
    </div>
  );
};

export default NetworkGraph;